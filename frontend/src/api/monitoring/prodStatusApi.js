import axiosInstance from '../axiosInstance';

// 모니터링 > 종합생산현황
export function getList(params) {
  return axiosInstance.get('/api/monitoring/prodStatus', { params }).then(res => res.data);
}
