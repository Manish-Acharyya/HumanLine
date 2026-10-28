import { get, post } from './client.js';

export const today = () => get('/attendance/today');
export const clockIn = (note = '') => post('/attendance/clock-in', { note });
export const clockOut = (note = '') => post('/attendance/clock-out', { note });
export const history = (params) => get('/attendance', { params });
export const summary = () => get('/attendance/summary');

export default { today, clockIn, clockOut, history, summary };
