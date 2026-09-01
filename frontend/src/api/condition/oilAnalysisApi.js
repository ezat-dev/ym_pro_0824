import axiosInstance from '../axiosInstance';

// 조건관리 > 열처리유성상분석 — 설비별 오일 성상분석 PDF 등록대장

export function getList(from, to, mchName) {
  return axiosInstance
    .get('/api/condition/oilAnalysis', { params: { from, to, mchName } })
    .then((res) => res.data);
}

export function getMchNames() {
  return axiosInstance.get('/api/condition/oilAnalysis/mchNames').then((res) => res.data);
}

export function getById(id) {
  return axiosInstance.get(`/api/condition/oilAnalysis/${id}`).then((res) => res.data);
}

export function createDoc(formData) {
  return axiosInstance
    .post('/api/condition/oilAnalysis', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((res) => res.data);
}

export function updateDoc(id, formData) {
  return axiosInstance
    .put(`/api/condition/oilAnalysis/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((res) => res.data);
}

export function deleteDoc(id) {
  return axiosInstance.delete(`/api/condition/oilAnalysis/${id}`).then((res) => res.data);
}

export function previewFileUrl(id, slot) {
  const base = axiosInstance.defaults.baseURL;
  return `${base}/api/condition/oilAnalysis/${id}/file/${slot}?mode=preview`;
}

export function downloadFileUrl(id, slot) {
  const base = axiosInstance.defaults.baseURL;
  return `${base}/api/condition/oilAnalysis/${id}/file/${slot}?mode=download`;
}
