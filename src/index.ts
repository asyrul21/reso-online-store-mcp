import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { Writable } from 'stream';
import { ConversationItem } from 'src/lib/ai/types';
import { handleAgentRequest } from 'src/lib/handler/agentHandler';
import config, { CLIENT_URLS } from './config';

// awslambda is injected by the Lambda runtime for streaming support
declare const awslambda: {
  streamifyResponse: (
    handler: (
      event: APIGatewayProxyEventV2,
      responseStream: Writable,
      context: any,
    ) => Promise<void>,
  ) => any;
  HttpResponseStream: {
    from: (stream: Writable, metadata: { statusCode: number; headers: Record<string, string> }) => Writable;
  };
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': CLIENT_URLS.join(','),
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, client-country-code',
  'Content-Type': 'text/plain; charset=utf-8',
  'Transfer-Encoding': 'chunked',
  'X-Content-Type-Options': 'nosniff',
};

export const handler = awslambda.streamifyResponse(
  async (event: APIGatewayProxyEventV2, responseStream: Writable, _context: any) => {
    const path = event.rawPath || '/';
    const method = event.requestContext?.http?.method?.toUpperCase() || 'GET';

    const httpStream = awslambda.HttpResponseStream.from(responseStream, {
      statusCode: 200,
      headers: CORS_HEADERS,
    });

    if (method === 'OPTIONS') {
      httpStream.end();
      return;
    }

    // Verify the request came through CloudFront by checking the secret header.
    // CloudFront injects X-Origin-Verify on every origin request; direct calls
    // to the Lambda Function URL will not have it.
    const originSecret = config.ENV_ORIGIN_VERIFY_SECRET;
    if (originSecret && event.headers?.['x-origin-verify'] !== originSecret) {
      httpStream.write(JSON.stringify({ message: 'Forbidden', key: 'FORBIDDEN' }));
      httpStream.end();
      return;
    }

    if (path === '/mcp/health' || path === '/mcp/health/') {
      httpStream.write(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
      httpStream.end();
      return;
    }

    if (method !== 'POST') {
      httpStream.write(JSON.stringify({ message: 'Method not allowed', key: 'METHOD_NOT_ALLOWED' }));
      httpStream.end();
      return;
    }

    const isAdminPath = path.startsWith('/mcp/admin');
    const isClientPath = path.startsWith('/mcp/client');

    if (!isAdminPath && !isClientPath) {
      httpStream.write(JSON.stringify({ message: 'Not found', key: 'NOT_FOUND' }));
      httpStream.end();
      return;
    }

    const authHeader = event.headers?.['authorization'] || event.headers?.['Authorization'];
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
    const countryCode = event.headers?.['client-country-code'] || '';

    if (!token) {
      httpStream.write(JSON.stringify({ message: 'Missing authorization token', key: 'MISSING_TOKEN' }));
      httpStream.end();
      return;
    }

    if (!countryCode) {
      httpStream.write(JSON.stringify({ message: 'Missing client-country-code header', key: 'MISSING_COUNTRY_CODE' }));
      httpStream.end();
      return;
    }

    let conversation: ConversationItem[] = [];
    let context: string | undefined;

    try {
      const body = JSON.parse(event.body || '{}');
      conversation = Array.isArray(body.conversation) ? body.conversation : [];
      context = typeof body.context === 'string' ? body.context : undefined;
    } catch (_e) {
      httpStream.write(JSON.stringify({ message: 'Invalid request body', key: 'BAD_REQUEST' }));
      httpStream.end();
      return;
    }

    const currency = event.queryStringParameters?.currency;

    const error = await handleAgentRequest(
      { token, countryCode, currency, conversation, context, isAdmin: isAdminPath },
      httpStream,
    );

    if (error) {
      httpStream.write(JSON.stringify({ message: error.message, key: error.key }));
    }

    httpStream.end();
  },
);
