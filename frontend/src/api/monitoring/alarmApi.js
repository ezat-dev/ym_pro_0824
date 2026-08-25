import axiosInstance from '../axiosInstance';

// 모니터링 > 경보모니터링
export function getList(params) {
  return axiosInstance.get('/api/monitoring/alarm', { params }).then(res => res.data);
}
