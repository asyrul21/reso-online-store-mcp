import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import config from 'src/config';
import { logger } from 'src/lib/logger';

const TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type ServerClientOptions = {
  authToken: string;
  countryCode: string;
  currency?: string;
};

export class ServerClient {
  private client: AxiosInstance;
  private currency?: string;

  constructor(private opts: ServerClientOptions) {
    this.currency = opts.currency;
    this.client = axios.create({
      baseURL: config.ENV_ONLINE_STORE_SERVER_URL,
      timeout: TIMEOUT_MS,
      headers: {
        'Authorization': `Bearer ${opts.authToken}`,
        'Content-Type': 'application/json',
        'client-country-code': opts.countryCode,
      },
    });
  }

  private buildParams(params?: Record<string, string | number | boolean | undefined>): Record<string, string> {
    const result: Record<string, string> = {};
    if (this.currency) {
      result['currency'] = this.currency;
    }
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== '') {
          result[key] = String(value);
        }
      }
    }
    return result;
  }

  private async executeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        const isRetryable =
          !error.response || error.response.status >= 500 || error.code === 'ECONNABORTED';
        if (!isRetryable || attempt === MAX_RETRIES) {
          throw error;
        }
        const delay = Math.pow(2, attempt - 1) * 1000;
        logger.warn('http_retry', { attempt, delay_ms: delay, error: error.message });
        await sleep(delay);
      }
    }
    throw lastError;
  }

  async get<T = any>(
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
  ): Promise<T> {
    return this.executeWithRetry(async () => {
      const response = await this.client.get<{ success: boolean; data: T }>(path, {
        params: this.buildParams(params),
      });
      return response.data.data ?? (response.data as any);
    });
  }

  async post<T = any>(path: string, body?: any): Promise<T> {
    return this.executeWithRetry(async () => {
      const response = await this.client.post<{ success: boolean; data: T }>(path, body, {
        params: this.buildParams(),
      });
      return response.data.data ?? (response.data as any);
    });
  }

  async put<T = any>(path: string, body?: any): Promise<T> {
    return this.executeWithRetry(async () => {
      const response = await this.client.put<{ success: boolean; data: T }>(path, body, {
        params: this.buildParams(),
      });
      return response.data.data ?? (response.data as any);
    });
  }
}
