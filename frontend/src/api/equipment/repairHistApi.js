import axiosInstance from '../axiosInstance';

// 설비관리 > 수리이력관리
export function getList(params) {
  return axiosInstance.get('/api/equipment/repairHist', { params }).then(res => res.data);
}
