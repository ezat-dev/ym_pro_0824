import axiosInstance from '../axiosInstance';

// 조건관리 > 관리계획서 및 작업표준서 — 문서 라이브러리(등록/수정/삭제 + 미리보기/다운로드)

export function getList(category, keyword) {
  return axiosInstance
    .get('/api/condition/standard', { params: { category, keyword } })
    .then((res) => res.data);
}

export function createDoc(formData) {
  return axiosInstance
    .post('/api/condition/standard', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((res) => res.data);
}

export function updateDoc(id, formData) {
  return axiosInstance
    .put(`/api/condition/standard/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((res) => res.data);
}

export function deleteDoc(id) {
  return axiosInstance.delete(`/api/condition/standard/${id}`).then((res) => res.data);
}

export function previewUrl(id) {
  const base = axiosInstance.defaults.baseURL;
  return `${base}/api/condition/standard/${id}/file?mode=preview`;
}

export function downloadUrl(id) {
  const base = axiosInstance.defaults.baseURL;
  return `${base}/api/condition/standard/${id}/file?mode=download`;
}
