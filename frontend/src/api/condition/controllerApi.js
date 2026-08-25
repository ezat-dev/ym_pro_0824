import axiosInstance from '../axiosInstance';

// 조건관리 > 조절계 관리
export function getList(params) {
  return axiosInstance.get('/api/condition/controller', { params }).then(res => res.data);
}
