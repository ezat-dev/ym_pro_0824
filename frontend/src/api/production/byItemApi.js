import axiosInstance from '../axiosInstance';

// 생산관리 > 제품별작업관리
export function getList(params) {
  return axiosInstance.get('/api/production/byItem', { params }).then(res => res.data);
}
