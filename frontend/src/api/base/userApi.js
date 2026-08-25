import axiosInstance from '../axiosInstance';

// 기준정보 > 사용자관리
export function getList(params) {
  return axiosInstance.get('/api/base/user', { params }).then((res) => res.data);
}

export function createUser(user) {
  return axiosInstance.post('/api/base/user', user).then((res) => res.data);
}

export function updateUser(userId, user) {
  return axiosInstance.put(`/api/base/user/${userId}`, user).then((res) => res.data);
}

export function deleteUser(userId) {
  return axiosInstance.delete(`/api/base/user/${userId}`).then((res) => res.data);
}
