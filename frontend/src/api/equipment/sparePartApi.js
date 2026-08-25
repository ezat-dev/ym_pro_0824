import axiosInstance from '../axiosInstance';

// 설비관리 > SPARE 부품관리
export function getList(params) {
  return axiosInstance.get('/api/equipment/sparePart', { params }).then(res => res.data);
}
