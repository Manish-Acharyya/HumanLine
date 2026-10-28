import { get, post } from './client.js';

export const mine = () => get('/payroll/me');
export const list = (params) => get('/payroll', { params });
export const generate = (month, year) => post('/payroll/generate', { month, year });
export const detail = (id) => get(`/payroll/${id}`);

export default { mine, list, generate, detail };
