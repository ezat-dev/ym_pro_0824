import axiosInstance from '../axiosInstance';

// 기준정보 > 패턴관리
export function getList(params) {
  return axiosInstance.get('/api/base/pattern', { params }).then(res => res.data);
}
