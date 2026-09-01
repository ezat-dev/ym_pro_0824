import axiosInstance from '../axiosInstance';

// 조건관리 > 조절계 관리 — 온도조절계 정도검사(교정) 이력

export function getList(year, equipName) {
  return axiosInstance
    .get('/api/condition/controller', { params: { year, equipName } })
    .then((res) => res.data);
}

export function getEquipNames() {
  return axiosInstance.get('/api/condition/controller/equipNames').then((res) => res.data);
}

export function getById(id) {
  return axiosInstance.get(`/api/condition/controller/${id}`).then((res) => res.data);
}

export function createController(formData) {
  return axiosInstance
    .post('/api/condition/controller', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((res) => res.data);
}

export function updateController(id, formData) {
  return axiosInstance
    .put(`/api/condition/controller/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((res) => res.data);
}

export function deleteControllers(ids) {
  return axiosInstance.post('/api/condition/controller/delete', ids).then((res) => res.data);
}

export function previewFileUrl(fileId) {
  const base = axiosInstance.defaults.baseURL;
  return `${base}/api/condition/controller/file/${fileId}?mode=preview`;
}

export function downloadFileUrl(fileId) {
  const base = axiosInstance.defaults.baseURL;
  return `${base}/api/condition/controller/file/${fileId}?mode=download`;
}
