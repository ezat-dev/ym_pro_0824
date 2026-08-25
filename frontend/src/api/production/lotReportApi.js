import axiosInstance from '../axiosInstance';

// 생산관리 > LOT 보고서
export function getList(params) {
  return axiosInstance.get('/api/production/lotReport', { params }).then(res => res.data);
}
