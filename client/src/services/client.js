import api from './api.js';

async function request(method, url, data, config) {
  const response = await api.request({ method, url, data, ...config });
  return response.data;
}

export const get = (url, config) => request('GET', url, undefined, config);
export const post = (url, data, config) => request('POST', url, data, config);
export const put = (url, data, config) => request('PUT', url, data, config);
export const patch = (url, data, config) => request('PATCH', url, data, config);
export const del = (url, config) => request('DELETE', url, undefined, config);

export default { get, post, put, patch, del };
