import axiosInstance from '../axiosInstance';

// 기준정보 > 로그인이력
export function getList(params) {
  return axiosInstance.get('/api/base/loginHist', { params }).then((res) => res.data);
}
