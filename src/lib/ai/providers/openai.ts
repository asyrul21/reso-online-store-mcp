import { OpenAI } from 'openai';
import config from 'src/config';

export const openai = new OpenAI({
  apiKey: config.ENV_OPENAI_API_KEY,
});
