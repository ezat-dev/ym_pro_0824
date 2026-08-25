import axiosInstance from '../axiosInstance';

// 조건관리 > 일상점검일지
export function getList(params) {
  return axiosInstance.get('/api/condition/dailyCheck', { params }).then(res => res.data);
}
