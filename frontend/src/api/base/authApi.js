import axiosInstance from '../axiosInstance';

// 기준정보 > 사용자권한 (메뉴별 CRUD 권한부여)
export function getAuthMenuItems(userId) {
  return axiosInstance.get(`/api/base/auth/${userId}`).then((res) => res.data);
}

export function saveAuthMenuItems(userId, items) {
  return axiosInstance.put(`/api/base/auth/${userId}`, items).then((res) => res.data);
}
