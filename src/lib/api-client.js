
import axios from 'axios';
import { HOST } from '../utils/constants';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URL + "/api",
  withCredentials: true,
});
