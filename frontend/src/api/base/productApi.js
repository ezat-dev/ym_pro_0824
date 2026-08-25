import axiosInstance from '../axiosInstance';

// 기준정보 > 제품관리
export function getList(params) {
  return axiosInstance.get('/api/base/product', { params }).then(res => res.data);
}
