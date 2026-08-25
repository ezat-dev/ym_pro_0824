import axiosInstance from '../axiosInstance';

// 설비관리 > 전력량
export function getList(params) {
  return axiosInstance.get('/api/equipment/powerUsage', { params }).then(res => res.data);
}
