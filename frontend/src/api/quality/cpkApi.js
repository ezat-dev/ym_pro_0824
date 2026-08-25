import axiosInstance from '../axiosInstance';

// 품질관리 > CPK 분석
export function getList(params) {
  return axiosInstance.get('/api/quality/cpk', { params }).then(res => res.data);
}
