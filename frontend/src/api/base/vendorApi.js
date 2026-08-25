import axiosInstance from '../axiosInstance';

// 기준정보 > 거래처관리
export function getList(params) {
  return axiosInstance.get('/api/base/vendor', { params }).then(res => res.data);
}
