import { Writable } from 'stream';
import { verifyToken, AuthError } from 'src/lib/auth';
import { ServerClient } from 'src/lib/http/client';
import { runAgent } from 'src/lib/ai/run';
import { ConversationItem, StreamError } from 'src/lib/ai/types';
import { logger } from 'src/lib/logger';

export type AgentHandlerInput = {
  token: string;
  countryCode: string;
  currency?: string;
  conversation: ConversationItem[];
  context?: string;
  isAdmin: boolean;
};

export type AgentHandlerError = {
  statusCode: number;
  message: string;
  key: string;
};

/**
 * Core agent request handler shared by the Lambda and Express wrappers.
 *
 * Returns an AgentHandlerError when authentication or authorization fails so
 * the caller can surface it in a platform-appropriate way (status code vs
 * plain stream write). Returns null on success — all output has already been
 * written to `stream`.
 */
export const handleAgentRequest = async (
  input: AgentHandlerInput,
  stream: Writable,
): Promise<AgentHandlerError | null> => {
  const { token, countryCode, currency, conversation, context, isAdmin } = input;

  // Verify token via the online-store-server /api/auth/me endpoint
  let user;
  try {
    user = await verifyToken(token, countryCode);
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        statusCode: error.statusCode,
        message: error.message,
        key: error.key || 'UNAUTHORIZED',
      };
    }
    return { statusCode: 401, message: 'Authentication failed', key: 'UNAUTHORIZED' };
  }

  // Admin path requires the administrator user type
  if (isAdmin && user.userType?.name !== 'administrator') {
    return { statusCode: 403, message: 'Forbidden: admin access required', key: 'FORBIDDEN' };
  }

  const serverClient = new ServerClient({ authToken: token, countryCode, currency });

  // Fetch allowed country codes to inject into the client agent prompt.
  // Failures are non-fatal — the prompt will fall back to a safe default.
  let allowedCountryCodes: string[] = [];
  try {
    const data = await serverClient.get<{ countryCodes: string[] }>('/api/currency/country-codes');
    allowedCountryCodes = data.countryCodes ?? [];
  } catch (err: any) {
    logger.warn('country_codes_fetch_failed', { error: err.message });
  }

  const result = await runAgent(conversation, stream, { isAdmin, context, serverClient, allowedCountryCodes });

  if (result && (result as StreamError).streamError) {
    stream.write(JSON.stringify(result));
  } else {
    stream.write(JSON.stringify({ streamCompletedAt: new Date().toISOString() }));
  }

  return null;
};
