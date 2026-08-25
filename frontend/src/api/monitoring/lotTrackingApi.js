import axiosInstance from '../axiosInstance';

// 모니터링 > LOT 트래킹
export function getList(params) {
  return axiosInstance.get('/api/monitoring/lotTracking', { params }).then(res => res.data);
}
