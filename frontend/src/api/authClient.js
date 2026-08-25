import axiosInstance from './axiosInstance';

// 로그인 화면 전용 API (사용자권한 메뉴의 base/auth와는 별개)
export function login(loginId, password) {
  return axiosInstance.post('/api/base/login', { loginId, password }).then((res) => res.data);
}
