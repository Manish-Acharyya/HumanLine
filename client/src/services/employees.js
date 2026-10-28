import { get, post, put, patch, del } from './client.js';

export const list = (params) => get('/employees', { params });
export const create = (payload) => post('/employees', payload);
export const detail = (id) => get(`/employees/${id}`);
export const update = (id, payload) => put(`/employees/${id}`, payload);
export const terminate = (id, reason) => patch(`/employees/${id}/terminate`, { reason });
export const remove = (id) => del(`/employees/${id}`);

export default { list, create, detail, update, terminate, remove };
