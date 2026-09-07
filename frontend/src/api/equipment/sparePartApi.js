import axiosInstance from '../axiosInstance';

// 설비관리 > SPARE 부품관리 — 설비별 스페어부품 마스터 + 입출고 이력

export function getList(equipName, keyword) {
  return axiosInstance
    .get('/api/equipment/sparePart', { params: { equipName: equipName || undefined, keyword: keyword || undefined } })
    .then((res) => res.data);
}

export function getEquipNames() {
  return axiosInstance.get('/api/equipment/sparePart/equipNames').then((res) => res.data);
}

export function getById(id) {
  return axiosInstance.get(`/api/equipment/sparePart/${id}`).then((res) => res.data);
}

export function createPart(part, initialQty) {
  return axiosInstance
    .post('/api/equipment/sparePart', part, { params: { initialQty: initialQty || undefined } })
    .then((res) => res.data);
}

export function updatePart(id, part) {
  return axiosInstance.put(`/api/equipment/sparePart/${id}`, part).then((res) => res.data);
}

export function deleteParts(ids) {
  return axiosInstance.post('/api/equipment/sparePart/delete', ids).then((res) => res.data);
}

export function getHistory(partId, type, from, to) {
  return axiosInstance
    .get('/api/equipment/sparePart/history', {
      params: { partId: partId || undefined, type: type || undefined, from: from || undefined, to: to || undefined },
    })
    .then((res) => res.data);
}

export function createHistory(history) {
  return axiosInstance.post('/api/equipment/sparePart/history', history).then((res) => res.data);
}

export function deleteHistory(id) {
  return axiosInstance.delete(`/api/equipment/sparePart/history/${id}`).then((res) => res.data);
}
