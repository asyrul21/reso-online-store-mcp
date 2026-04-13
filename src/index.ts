import { APIGatewayProxyEvent, APIGatewayProxyEventV2 } from 'aws-lambda';
import { Writable } from 'stream';
import { ConversationItem } from 'src/lib/ai/types';
import { handleAgentRequest } from 'src/lib/handler/agentHandler';
import config, { CLIENT_URLS } from './config';
import { logger } from './lib/logger';

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

const CORS_STATIC_HEADERS = {
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, client-country-code',
  'Content-Type': 'text/plain; charset=utf-8',
  'Transfer-Encoding': 'chunked',
  'X-Content-Type-Options': 'nosniff',
};

function getCorsHeaders(requestOrigin: string | undefined): Record<string, string> {
  // Access-Control-Allow-Origin must be a single value — echo back the matched origin.
  const allowedOrigin =
    requestOrigin && CLIENT_URLS.includes(requestOrigin) ? requestOrigin : CLIENT_URLS[0] ?? '';
  return {
    ...CORS_STATIC_HEADERS,
    'Access-Control-Allow-Origin': allowedOrigin,
    'Vary': 'Origin',
  };
}

export const handler = awslambda.streamifyResponse(
  async (event: APIGatewayProxyEventV2 | APIGatewayProxyEvent, responseStream: Writable, _context: any) => {
    // Support both REST API (v1: event.path, event.httpMethod) and HTTP API (v2: event.rawPath, event.requestContext.http.method)
    const path = (event as APIGatewayProxyEventV2).rawPath || (event as APIGatewayProxyEvent).path || '/';
    const method = (
      (event as APIGatewayProxyEventV2).requestContext?.http?.method ||
      (event as APIGatewayProxyEvent).httpMethod ||
      'GET'
    ).toUpperCase();

    const requestOrigin = event.headers?.['origin'] || event.headers?.['Origin'];
    const corsHeaders = getCorsHeaders(requestOrigin);

    logger.info('Received request:', {
      path, method, event, corsHeaders,
    });

    const httpStream = awslambda.HttpResponseStream.from(responseStream, {
      statusCode: 200,
      headers: corsHeaders,
    });

    logger.info('HttpStream Created');

    if (method === 'OPTIONS') {
      httpStream.end();
      return;
    }

    if (path === '/' || path === '/mcp/health' || path === '/mcp/health/') {
      let payload: unknown = 'Not provided';
      if (event.body) {
        try {
          payload = JSON.parse(event.body);
        } catch {
          payload = event.body;
        }
      }
      httpStream.write(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString(), payload }));
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

    logger.info('Authentication headers:', { authHeader, countryCode });

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

    logger.info('Conversation:', { conversation, context });

    const currency = event.queryStringParameters?.currency;

    logger.info('Currency:', { currency });

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
