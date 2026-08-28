import axiosInstance from '../axiosInstance';

// 모니터링 > 경보랭킹 (서버 사이드 GROUP BY 집계)
export function getRank(from, to, groupBy = 'tag') {
  return axiosInstance.get('/api/monitoring/alarmRank', { params: { from, to, groupBy } }).then(res => res.data);
}

// 설비별 발생 추이 — bucketUnit: 'HOUR'(당일) | 'DAY'(주/월/전체)
export function getTrendByFolder(from, to, bucketUnit = 'DAY') {
  return axiosInstance.get('/api/monitoring/alarm/trendByFolder', { params: { from, to, bucketUnit } }).then(res => res.data);
}
