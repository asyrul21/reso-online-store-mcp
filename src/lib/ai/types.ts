import { FunctionTool } from 'openai/resources/responses/responses.js';
import { ServerClient } from 'src/lib/http/client';

export type ToolContext = {
  serverClient: ServerClient;
};

export type AiAgentTool = {
  meta: FunctionTool;
  fn: (args: any, ctx: ToolContext) => Promise<any>;
};

type StreamErrorObj = {
  status: number;
  message: string;
};

export type StreamError = {
  streamError: StreamErrorObj;
};

export type TokenUsage = {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
};

export type ConversationItem = {
  role?: 'user' | 'assistant';
  content?: string;
  id?: string;
  type?: 'function_call' | 'function_call_output';
  status?: string;
  arguments?: string;
  call_id?: string;
  name?: string;
  output?: string;
};
