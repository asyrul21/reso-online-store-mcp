import dotenv from 'dotenv';
dotenv.config();

const config = {
  ENV_API_SERVER_URL: process.env.API_SERVER_URL || '',
  ENV_CLIENT_DOMAIN_URLS: process.env.CLIENT_DOMAIN_URLS || '',
  ENV_OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  ENV_OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o',
  ENV_MAX_ITERATIONS: parseInt(process.env.MAX_ITERATIONS || '20', 10),
  ENV_MAX_TOTAL_TOKENS: parseInt(process.env.MAX_TOTAL_TOKENS || '200000', 10),
  ENV_PORT: parseInt(process.env.PORT || '3001', 10),
  ENV_NODE_ENV: process.env.NODE_ENV || 'development',
};

const requiredVars: (keyof typeof config)[] = [
  'ENV_API_SERVER_URL',
  'ENV_OPENAI_API_KEY',
  'ENV_CLIENT_DOMAIN_URLS',
];

export const CLIENT_URLS = config.ENV_CLIENT_DOMAIN_URLS?.split(',') || [];

for (const key of requiredVars) {
  if (!config[key]) {
    throw new Error(`Missing required environment variable: ${key.replace('ENV_', '')}`);
  }
}

export default config;
