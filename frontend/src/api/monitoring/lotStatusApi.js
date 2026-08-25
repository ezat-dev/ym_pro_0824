import axiosInstance from '../axiosInstance';

// 모니터링 > LOT 현황
export function getList(params) {
  return axiosInstance.get('/api/monitoring/lotStatus', { params }).then(res => res.data);
}
