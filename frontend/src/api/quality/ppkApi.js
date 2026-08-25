import axiosInstance from '../axiosInstance';

// 품질관리 > PPK 분석
export function getList(params) {
  return axiosInstance.get('/api/quality/ppk', { params }).then(res => res.data);
}
