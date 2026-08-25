import axiosInstance from '../axiosInstance';

// 품질관리 > 부적합품관리
export function getList(params) {
  return axiosInstance.get('/api/quality/nonconform', { params }).then(res => res.data);
}
