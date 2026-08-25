import axiosInstance from '../axiosInstance';

// 모니터링 > TREND
export function getList(params) {
  return axiosInstance.get('/api/monitoring/trend', { params }).then(res => res.data);
}
