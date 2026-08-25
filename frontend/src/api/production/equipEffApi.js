import axiosInstance from '../axiosInstance';

// 생산관리 > 설비효율현황
export function getList(params) {
  return axiosInstance.get('/api/production/equipEff', { params }).then(res => res.data);
}
