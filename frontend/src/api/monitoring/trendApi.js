import axiosInstance from '../axiosInstance';

// 모니터링 > TREND — 태그 목록은 트렌드 설정(trendSettingsApi)과 같은 실데이터를 공유한다.
export function getTags() {
  return axiosInstance.get('/api/monitoring/trendSettings').then(res => res.data);
}

export function getSnapshotRange(from, to) {
  return axiosInstance.get('/api/monitoring/trend/snapshotRange', { params: { from, to } }).then(res => res.data);
}

export function getMemos(from, to) {
  return axiosInstance.get('/api/monitoring/trend/memos', { params: { from, to } }).then(res => res.data);
}

export function createMemo(memo) {
  return axiosInstance.post('/api/monitoring/trend/memos', memo).then(res => res.data);
}

export function deleteMemo(tcCnt) {
  return axiosInstance.delete(`/api/monitoring/trend/memos/${tcCnt}`).then(res => res.data);
}
