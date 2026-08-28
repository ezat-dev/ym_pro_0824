import axiosInstance from '../axiosInstance';

// 모니터링 > 경보모니터링 (ez_scada 실데이터)
export function getList(params) {
  return axiosInstance.get('/api/monitoring/alarm', { params }).then(res => res.data);
}

export function getActive(limit = 50) {
  return axiosInstance.get('/api/monitoring/alarm/active', { params: { limit } }).then(res => res.data);
}

export function getHistory(limit = 500) {
  return axiosInstance.get('/api/monitoring/alarm/history', { params: { limit } }).then(res => res.data);
}

export function getHistoryRange(from, to) {
  return axiosInstance.get('/api/monitoring/alarm/historyRange', { params: { from, to } }).then(res => res.data);
}

export function getFolders() {
  return axiosInstance.get('/api/monitoring/alarm/folders').then(res => res.data);
}

export function createFolder(folderName) {
  return axiosInstance.post('/api/monitoring/alarm/folders', { folderName }).then(res => res.data);
}

export function deleteFolder(folderId) {
  return axiosInstance.delete(`/api/monitoring/alarm/folders/${folderId}`).then(res => res.data);
}

export function getTags(folderId) {
  return axiosInstance.get('/api/monitoring/alarm/tags', { params: { folderId } }).then(res => res.data);
}

export function createTag(tag) {
  return axiosInstance.post('/api/monitoring/alarm/tags', tag).then(res => res.data);
}

export function updateTag(tagId, tag) {
  return axiosInstance.put(`/api/monitoring/alarm/tags/${tagId}`, tag).then(res => res.data);
}

export function deleteTag(tagId) {
  return axiosInstance.delete(`/api/monitoring/alarm/tags/${tagId}`).then(res => res.data);
}

export function getPlcs() {
  return axiosInstance.get('/api/monitoring/alarm/plcs').then(res => res.data);
}

export function savePlc(plc) {
  return axiosInstance.post('/api/monitoring/alarm/plcs', plc).then(res => res.data);
}

export function deletePlc(plcId) {
  return axiosInstance.delete(`/api/monitoring/alarm/plcs/${plcId}`).then(res => res.data);
}

// 설비(tb_alarm_folder 기준)별 최다 발생 메시지 — 대시보드 카드 / 경보랭킹 상세에서 공용으로 쓴다.
export function getMessageCountsByFolder(from, to) {
  return axiosInstance.get('/api/monitoring/alarm/messagesByFolder', { params: { from, to } }).then(res => res.data);
}

// 최근 N시간 시간대별 총 발생 건수(0건인 시간대도 채워서 반환) — 대시보드 24시간 추이 카드.
export function getTrend(hours = 24) {
  return axiosInstance.get('/api/monitoring/alarm/trend', { params: { hours } }).then(res => res.data);
}

// 최근 N시간, 시간대별×레벨별 누적 발생 건수(빈 시간대·빈 레벨 0으로 채워서 반환) — 대시보드 메인 영역 차트.
export function getTrendBySeverity(hours = 24) {
  return axiosInstance.get('/api/monitoring/alarm/trendBySeverity', { params: { hours } }).then(res => res.data);
}

// 최근 N시간, 설비×레벨별 발생 건수 — 대시보드 수평 누적 막대 차트.
export function getCountByFolderSeverity(hours = 24) {
  return axiosInstance.get('/api/monitoring/alarm/countByFolderSeverity', { params: { hours } }).then(res => res.data);
}

// 최근 N시간, 시간대별 알람 응답(해제 소요) 평균 시간(분) — 해제된 알람만 대상.
export function getResponseTimeTrend(hours = 24) {
  return axiosInstance.get('/api/monitoring/alarm/responseTimeTrend', { params: { hours } }).then(res => res.data);
}
