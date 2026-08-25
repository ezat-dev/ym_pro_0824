import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { IconLock, IconUser, IconHexagon, IconPhoto } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { login as loginApi } from '../api/authClient';
import './LoginPage.css';

export default function LoginPage() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!loginId.trim() || !password.trim()) {
      setError('아이디와 비밀번호를 입력해주세요.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await loginApi(loginId.trim(), password);
      login(res.data, remember);
      const dest = location.state?.from?.pathname || '/';
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message ?? '로그인에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-screen">
      {/* 좌측 브랜드 패널 — 회사 로고/사진 전달되면 이 영역만 교체 */}
      <div className="login-brand">
        <div className="login-brand-top">
          <div className="login-logo-slot">
            <IconHexagon size={22} />
          </div>
          <span className="login-brand-name">SMART MES</span>
        </div>

        <div className="login-brand-middle">
          <h1 className="login-brand-headline">
            제조 현장의 모든 데이터를
            <br />
            한 화면에서 관리하세요
          </h1>
          <p className="login-brand-sub">
            생산·설비·품질·조건관리 데이터를 통합 모니터링하고
            <br />
            메뉴별 권한을 세밀하게 관리할 수 있는 관리자 시스템입니다.
          </p>

          <div className="login-brand-photo-slot">
            <IconPhoto size={28} style={{ flexShrink: 0 }} />
            <span>회사 사진 / 로고 전달 후 이 영역에 배치 예정 (login-brand 배경 교체)</span>
          </div>
        </div>

        <div className="login-brand-bottom">© 2026 회사명이 들어갈 자리. All rights reserved.</div>
      </div>

      {/* 우측 로그인 폼 */}
      <div className="login-form-panel">
        <div className="login-form-box">
          <div className="login-mobile-brand">
            <div className="login-logo-slot" style={{ borderColor: 'var(--mes-border)', color: 'var(--mes-accent)' }}>
              <IconHexagon size={20} />
            </div>
            <span style={{ fontWeight: 700, color: 'var(--mes-text)' }}>SMART MES</span>
          </div>

          <h2 className="login-form-title">로그인</h2>
          <p className="login-form-desc">사내 MES 관리자 시스템에 접속합니다.</p>

          <form onSubmit={handleSubmit}>
            <div className="login-field">
              <IconUser size={16} />
              <input
                placeholder="아이디"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                autoFocus
                autoComplete="username"
              />
            </div>
            <div className="login-field">
              <IconLock size={16} />
              <input
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <label className="login-remember">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              로그인 상태 유지
            </label>

            {error && <div className="login-error">{error}</div>}

            <button type="submit" className="login-submit" disabled={submitting}>
              {submitting ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className="login-footer">문의: 시스템관리팀 · 사내 폐쇄망 전용</div>
        </div>
      </div>
    </div>
  );
}
