import axios from 'axios';
import { LLM_API_CONFIG } from '@config/api.config.ts';
import { setupInterceptors } from './httpInterceptors.ts';

const axiosLlmClient = axios.create({
  baseURL: LLM_API_CONFIG.BASE_URL,
  timeout: LLM_API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

setupInterceptors(axiosLlmClient);

export { axiosLlmClient };
