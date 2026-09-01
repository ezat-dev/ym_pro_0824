import axiosInstance from '../axiosInstance';

// 조건관리 > 일상점검일지 — 월별 체크리스트 그리드

export function getListByYm(ym) {
  return axiosInstance
    .post('/api/condition/dailyCheck/list', null, { params: { ym } })
    .then((res) => res.data);
}

export function updateField(cnt, dField, dValue) {
  return axiosInstance
    .post('/api/condition/dailyCheck/update', null, { params: { cnt, dField, dValue } })
    .then((res) => res.data);
}

export function insertRow(ym) {
  return axiosInstance
    .post('/api/condition/dailyCheck/insert', null, { params: { ym } })
    .then((res) => res.data);
}

export function deleteRow(cnt) {
  return axiosInstance
    .post('/api/condition/dailyCheck/delete', null, { params: { cnt } })
    .then((res) => res.data);
}

export function uploadImage(cnt, file) {
  const form = new FormData();
  form.append('cnt', cnt);
  form.append('file', file);
  return axiosInstance
    .post('/api/condition/dailyCheck/uploadImage', form, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((res) => res.data);
}

export function viewImageUrl(fileName) {
  const base = axiosInstance.defaults.baseURL;
  return `${base}/api/condition/dailyCheck/viewImage?fileName=${encodeURIComponent(fileName)}`;
}
