import axiosInstance from '../axiosInstance';

// 모니터링 > 경보랭킹
export function getList(params) {
  return axiosInstance.get('/api/monitoring/alarmRank', { params }).then(res => res.data);
}
