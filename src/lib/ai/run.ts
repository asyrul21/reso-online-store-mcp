import { openai } from './providers/openai';
import { adminAgentTools, clientAgentTools } from './tools';
import {
  ResponseFunctionToolCallItem,
  ResponseInput,
  ResponseInputItem,
} from 'openai/resources/responses/responses.js';
import { Writable } from 'stream';
import config from 'src/config';
import { StreamError, AiAgentTool, ToolContext, ConversationItem } from './types';
import { getAdminAgentPrompt, getClientAgentPrompt } from './prompts/agent';
import { ServerClient } from 'src/lib/http/client';
import { logger } from 'src/lib/logger';

const CHAT_META_MARKER = '{"meta":';
const MAX_OUTPUT_TOKENS_PER_TURN = 4096;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function simpleDeepEqual(a: any, b: any): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export type RunAgentOptions = {
  isAdmin: boolean;
  context?: string;
  serverClient: ServerClient;
  allowedCountryCodes?: string[];
};

export const runAgent = async (
  currentConversation: ConversationItem[],
  resultStream: Writable,
  options: RunAgentOptions,
): Promise<void | StreamError> => {
  try {
    const systemPrompt = options.isAdmin
      ? getAdminAgentPrompt(options.context)
      : getClientAgentPrompt(options.allowedCountryCodes ?? [], options.context);

    const toolsRegistry: Record<string, AiAgentTool> = options.isAdmin
      ? adminAgentTools
      : clientAgentTools;

    const toolDefs = Object.keys(toolsRegistry).map((t) => toolsRegistry[t].meta);

    const toolCtx: ToolContext = {
      serverClient: options.serverClient,
    };

    const messages: ResponseInput = [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...(currentConversation as ResponseInput),
    ];


    /**
     * The Agentic Loop
     */
    let iteration = 0;
    let cumulativeTokens = 0;
    while (true) {
      /**
       * SHORT CIRCUIT: TODO: to improve and test
       */
      if (messages.length >= 3) {
        if (simpleDeepEqual(messages[messages.length - 1], messages[messages.length - 2])) {
          break;
        }
      }

      if (iteration >= config.ENV_MAX_ITERATIONS) {
        logger.warn('agent_max_iterations_reached', { iteration });
        resultStream.write('\nMax iterations reached. Ending conversation.');
        break;
      }

      iteration++;
      logger.info('agent_iteration_start', { iteration });

      let result = '';
      let iterationUsage: { input_tokens: number; output_tokens: number; total_tokens: number } | undefined;
      resultStream.write('<output>');

      // throw new Error('test error');

      const stream = await openai.responses.create({
        model: config.ENV_OPENAI_MODEL,
        input: messages,
        tools: toolDefs,
        tool_choice: 'auto',
        stream: true,
        max_output_tokens: MAX_OUTPUT_TOKENS_PER_TURN,
      });

      const toolCallDeltas: Record<number, ResponseFunctionToolCallItem> = {};

      for await (const chunk of stream) {
        /**
         * Tools Stream
         */
        if (chunk.type === 'response.output_item.added') {
          if (chunk.item.type === 'function_call') {
            toolCallDeltas[chunk.output_index] = chunk.item as ResponseFunctionToolCallItem;
          }
        } else if (chunk.type === 'response.function_call_arguments.delta') {
          const index = chunk.output_index;
          if (toolCallDeltas[index]) {
            toolCallDeltas[index].arguments += chunk.delta;
          }
        } else if (chunk.type === 'response.function_call_arguments.done') {
          const index = chunk.output_index;
          if (toolCallDeltas[index]) {
            toolCallDeltas[index].status = 'completed';
          }
          break;
        } else if (chunk.type === 'response.output_text.delta') {
          /**
           * Text Stream
           */
          const content = chunk.delta || '';
          resultStream.write(content);
          result += content;
        } else if (chunk.type === 'response.completed') {
          const usage = chunk.response?.usage;
          if (usage) {
            iterationUsage = {
              input_tokens: usage.input_tokens ?? 0,
              output_tokens: usage.output_tokens ?? 0,
              total_tokens: (usage.input_tokens ?? 0) + (usage.output_tokens ?? 0),
            };
            /**
            * Do something with the usage
            */
          }
        }
      }

      if (iterationUsage) {
        cumulativeTokens += iterationUsage.total_tokens;
        logger.info('token_usage', {
          iteration,
          input_tokens: iterationUsage.input_tokens,
          output_tokens: iterationUsage.output_tokens,
          total_tokens: iterationUsage.total_tokens,
          cumulative_tokens: cumulativeTokens,
        });
      }

      if (Object.keys(toolCallDeltas).length > 0) {
        /**
         * If tool call also includes text response
         */
        if (result && result !== '') {
          messages.push({ role: 'assistant', content: result });
        }

        for (const [, toolCall] of Object.entries(toolCallDeltas)) {
          const toolName = toolCall.name;
          const toolFn = toolsRegistry[toolName]?.fn;

          if (!toolFn) {
            logger.error('unknown_tool', { toolName });
            continue;
          }

          const toolArgs = JSON.parse(toolCall.arguments || '{}');
          logger.info('tool_call', { toolName, toolArgs });

          const toolCallStartMs = Date.now();
          const toolResponse = await toolFn(toolArgs, toolCtx);
          const toolCallDurationMs = Date.now() - toolCallStartMs;

          logger.info('tool_response', { toolName, duration_ms: toolCallDurationMs, status: 'ok' });

          messages.push({ ...toolCall });

          const toolCallOutput = `${JSON.stringify({ meta: { ...toolCall } })}</output><output>`;

          result += toolCallOutput;
          resultStream.write(toolCallOutput);

          /**
           * Add the tool response
           */
          const toolResponseInput: ResponseInputItem = {
            type: 'function_call_output',
            call_id: toolCall.call_id,
            output: JSON.stringify(toolResponse),
          };
          messages.push(toolResponseInput);

          /**
           * Add the result
           */
          const toolResponseOutput = `${JSON.stringify({ meta: { ...toolResponseInput } })}</output>`;
          result += toolResponseOutput;
          resultStream.write(toolResponseOutput);
        }

        if (cumulativeTokens >= config.ENV_MAX_TOTAL_TOKENS) {
          logger.error('token_budget_exceeded', { cumulativeTokens });
          throw new Error('Token budget exceeded');
        }

        continue;
      }

      let chatMeta: any;
      if (result.includes(CHAT_META_MARKER)) {
        const metaIndex = result.indexOf(CHAT_META_MARKER);
        const chatMetaJson = result.substring(metaIndex);
        try {
          chatMeta = JSON.parse(chatMetaJson);
        } catch (_e) {
          // malformed meta — continue
        }
        result = result.replace(chatMetaJson, '');
      }

      resultStream.write('</output>');

      if (
        chatMeta?.meta?.chatStatus === 'COMPLETED' ||
        chatMeta?.meta?.chatStatus === 'QUERY'
      ) {
        logger.info('agent_loop_exit', { chatStatus: chatMeta.meta.chatStatus });
        break;
      }

      messages.push({ role: 'assistant', content: result });

      if (cumulativeTokens >= config.ENV_MAX_TOTAL_TOKENS) {
        logger.error('token_budget_exceeded', { cumulativeTokens });
        throw new Error('Token budget exceeded');
      }
      
      /**
       * Sleep to prevent rate limiting
      */
      await sleep(1000);
    }
        
    logger.info('agent_finished', { iteration, cumulativeTokens });
  } catch (error: any) {
    logger.error('agent_error', { message: error.message, stack: error.stack });
    const message = error.response?.message || error.message || 'Failed to stream response';
    const status = error.response?.statusCode || error.status || 500;
    return {
      streamError: { status, message },
    } as StreamError;
  }
};
