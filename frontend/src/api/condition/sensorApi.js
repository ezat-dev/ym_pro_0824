import axiosInstance from '../axiosInstance';

// 조건관리 > 열전대/센서 관리
export function getList(params) {
  return axiosInstance.get('/api/condition/sensor', { params }).then(res => res.data);
}
