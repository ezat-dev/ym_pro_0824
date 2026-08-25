import axiosInstance from '../axiosInstance';

// 품질관리 > 온도균일성보고서
export function getList(params) {
  return axiosInstance.get('/api/quality/tempUniform', { params }).then(res => res.data);
}
