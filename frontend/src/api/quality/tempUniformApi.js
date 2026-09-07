import axiosInstance from '../axiosInstance';

// 품질관리 > 온도균일성보고서 — 로(furnace) 온도균일성조사(TUS) 기록

export function getList(equipName, judgment, from, to) {
  return axiosInstance
    .get('/api/quality/tempUniform', { params: { equipName: equipName || undefined, judgment: judgment || undefined, from: from || undefined, to: to || undefined } })
    .then((res) => res.data);
}

export function getEquipNames() {
  return axiosInstance.get('/api/quality/tempUniform/equipNames').then((res) => res.data);
}

export function getById(id) {
  return axiosInstance.get(`/api/quality/tempUniform/${id}`).then((res) => res.data);
}

export function createTempUniform(formData) {
  return axiosInstance
    .post('/api/quality/tempUniform', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((res) => res.data);
}

export function updateTempUniform(id, formData) {
  return axiosInstance
    .put(`/api/quality/tempUniform/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((res) => res.data);
}

export function deleteTempUniform(id) {
  return axiosInstance.delete(`/api/quality/tempUniform/${id}`).then((res) => res.data);
}

export function previewFileUrl(id) {
  const base = axiosInstance.defaults.baseURL;
  return `${base}/api/quality/tempUniform/${id}/file?mode=preview`;
}

export function downloadFileUrl(id) {
  const base = axiosInstance.defaults.baseURL;
  return `${base}/api/quality/tempUniform/${id}/file?mode=download`;
}
