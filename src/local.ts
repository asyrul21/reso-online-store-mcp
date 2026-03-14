/**
 * Local development server.
 *
 * SAM local does not support Lambda Function URLs with RESPONSE_STREAM.
 * This Express server mimics the Lambda handler for local development,
 * forwarding requests to the agentic loop and piping the stream response.
 *
 * Usage: npm run dev
 */
import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import morgan from 'morgan';
import * as Stream from 'stream';
import config, { CLIENT_URLS } from 'src/config';
import { handleAgentRequest } from 'src/lib/handler/agentHandler';
import { logger } from 'src/lib/logger';

export const CORS_CONFIG = {
  origin: CLIENT_URLS,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
};

const app = express();

app.use(cookieParser());
app.use(express.json());
logger.info('CORS_CONFIG:', CORS_CONFIG);
app.use(cors(CORS_CONFIG));
app.use(morgan('dev'));

app.get('/mcp/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function handleRequest(req: Request, res: Response, isAdmin: boolean) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
  const countryCode = req.headers['client-country-code'] as string | undefined;
  const currency = req.query['currency'] as string | undefined;

  if (!token) {
    res.status(401).json({ message: 'Missing authorization token', key: 'MISSING_TOKEN' });
    return;
  }

  if (!countryCode) {
    res.status(400).json({ message: 'Missing client-country-code header', key: 'MISSING_COUNTRY_CODE' });
    return;
  }

  const { conversation = [], context } = req.body;

  res.set({
    'Content-Type': 'text/plain; charset=utf-8',
    'Transfer-Encoding': 'chunked',
    'X-Content-Type-Options': 'nosniff',
  });

  const resultStream = new Stream.PassThrough();
  resultStream.pipe(res);

  const error = await handleAgentRequest(
    { token, countryCode, currency, conversation, context, isAdmin },
    resultStream,
  );

  if (error) {
    res.status(error.statusCode).json({ message: error.message, key: error.key });
    return;
  }

  resultStream.push(null);
}

app.post('/mcp/admin', (req: Request, res: Response) => {
  handleRequest(req, res, true);
});

app.post('/mcp/client', (req: Request, res: Response) => {
  handleRequest(req, res, false);
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: 'Not found', key: 'NOT_FOUND' });
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('unhandled_error', { message: err.message });
  res.status(500).json({ message: 'Internal server error', key: 'INTERNAL_ERROR' });
});

const PORT = config.ENV_PORT;
app.listen(PORT, () => {
  logger.info(`MCP local server running on http://localhost:${PORT}`);
  logger.info(`  POST http://localhost:${PORT}/mcp/admin`);
  logger.info(`  POST http://localhost:${PORT}/mcp/client`);
  logger.info(`  GET  http://localhost:${PORT}/mcp/health`);
});

export default app;
