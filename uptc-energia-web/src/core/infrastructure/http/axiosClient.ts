import axios from 'axios';
import { API_CONFIG } from '@config/api.config.ts';
import { setupInterceptors } from './httpInterceptors.ts';

const axiosConsultaClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

setupInterceptors(axiosConsultaClient);

export { axiosConsultaClient };
