import axiosInstance from '../axiosInstance';

// 모니터링 > 통합모니터링
export function getList(params) {
  return axiosInstance.get('/api/monitoring/integrated', { params }).then(res => res.data);
}
