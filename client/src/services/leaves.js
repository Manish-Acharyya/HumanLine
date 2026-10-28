import { get, post, patch } from './client.js';

export const list = (params) => get('/leaves', { params });
export const create = (payload) => post('/leaves', payload);
export const approve = (id, comment = '') => patch(`/leaves/${id}/approve`, { comment });
export const reject = (id, comment = '') => patch(`/leaves/${id}/reject`, { comment });

export default { list, create, approve, reject };
