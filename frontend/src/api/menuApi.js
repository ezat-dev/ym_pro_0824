import axiosInstance from './axiosInstance';

export function getMenuTree() {
  return axiosInstance.get('/api/menu/tree').then(res => res.data);
}
