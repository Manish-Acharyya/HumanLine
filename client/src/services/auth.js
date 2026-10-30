import { get, post, put } from './client.js';

export const login = (credentials) => post('/auth/login', credentials);
export const register = (payload) => post('/auth/register', payload);
export const logout = () => post('/auth/logout');
export const me = () => get('/auth/me');
export const updateProfile = (payload) => put('/auth/profile', payload);

export default {
  login,
  register,
  logout,
  me,
  updateProfile,
};
