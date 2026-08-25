import axiosInstance from '../axiosInstance';

// 생산관리 > 작업일보
export function getList(params) {
  return axiosInstance.get('/api/production/dailyReport', { params }).then(res => res.data);
}
