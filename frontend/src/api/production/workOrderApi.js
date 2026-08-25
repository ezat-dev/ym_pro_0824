import axiosInstance from '../axiosInstance';

// 생산관리 > 작업지시관리
export function getList(params) {
  return axiosInstance.get('/api/production/workOrder', { params }).then(res => res.data);
}
