import axiosInstance from '../axiosInstance';

// 조건관리 > 열처리유성상분석
export function getList(params) {
  return axiosInstance.get('/api/condition/oilAnalysis', { params }).then(res => res.data);
}
