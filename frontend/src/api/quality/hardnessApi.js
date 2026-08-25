import axiosInstance from '../axiosInstance';

// 품질관리 > 경도관리
export function getList(params) {
  return axiosInstance.get('/api/quality/hardness', { params }).then(res => res.data);
}
