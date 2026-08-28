import axiosInstance from '../axiosInstance';

// 모니터링 > 트렌드 설정 (ez_scada.tb_temp_tag 실데이터 — TREND 차트가 그리는 온도 태그 정의)
export function getFullList() {
  return axiosInstance.get('/api/monitoring/trendSettings').then(res => res.data);
}

export function createTag(tag) {
  return axiosInstance.post('/api/monitoring/trendSettings', tag).then(res => res.data);
}

export function updateTag(tempId, tag) {
  return axiosInstance.put(`/api/monitoring/trendSettings/${tempId}`, tag).then(res => res.data);
}

export function deleteTag(tempId) {
  return axiosInstance.delete(`/api/monitoring/trendSettings/${tempId}`).then(res => res.data);
}

export function getSnapshots(limit = 200) {
  return axiosInstance.get('/api/monitoring/trendSettings/snapshots', { params: { limit } }).then(res => res.data);
}
