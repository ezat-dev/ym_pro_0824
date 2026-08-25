import axiosInstance from '../axiosInstance';

// 품질관리 > F/PROOF
export function getList(params) {
  return axiosInstance.get('/api/quality/fproof', { params }).then(res => res.data);
}
