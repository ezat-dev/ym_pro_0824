import axiosInstance from '../axiosInstance';

// 조건관리 > 열전대/센서 관리 — 설비/존별 연간 열전대·센서 교체이력

export function getList(year, sensorType) {
  return axiosInstance
    .get('/api/condition/sensor', { params: { year, sensorType: sensorType || undefined } })
    .then((res) => res.data);
}

export function createSensor(sensor) {
  return axiosInstance.post('/api/condition/sensor', sensor).then((res) => res.data);
}

export function updateSensor(id, sensor) {
  return axiosInstance.put(`/api/condition/sensor/${id}`, sensor).then((res) => res.data);
}

export function deleteSensors(ids) {
  return axiosInstance.post('/api/condition/sensor/delete', ids).then((res) => res.data);
}
