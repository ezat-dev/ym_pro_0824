import axiosInstance from '../axiosInstance';

// 조건관리 > 관리계획서 및 작업표준서
export function getList(params) {
  return axiosInstance.get('/api/condition/standard', { params }).then(res => res.data);
}
