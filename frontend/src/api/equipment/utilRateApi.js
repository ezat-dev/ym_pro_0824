import axiosInstance from '../axiosInstance';

// 설비관리 > 설비가동률분석
export function getList(params) {
  return axiosInstance.get('/api/equipment/utilRate', { params }).then(res => res.data);
}
