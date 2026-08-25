import axiosInstance from '../axiosInstance';

// 설비관리 > 설비비가동현황
export function getList(params) {
  return axiosInstance.get('/api/equipment/downStatus', { params }).then(res => res.data);
}
