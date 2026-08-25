import axiosInstance from '../axiosInstance';

// 설비관리 > 설비이력관리
export function getList(params) {
  return axiosInstance.get('/api/equipment/history', { params }).then(res => res.data);
}
