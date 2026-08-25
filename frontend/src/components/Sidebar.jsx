import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  IconHexagon, IconChevronLeft, IconChevronRight, IconChevronDown,
  IconDatabase, IconActivity, IconClipboardList, IconAdjustments,
  IconCertificate, IconSettings, IconLogout
} from '@tabler/icons-react';
import MENU_DATA from '../constants/menuData';
import { useAuth } from '../context/AuthContext';

// 대분류별 아이콘 매핑
const CATEGORY_ICONS = {
  '기준정보': IconDatabase,
  '모니터링': IconActivity,
  '생산관리': IconClipboardList,
  '조건관리': IconAdjustments,
  '품질관리': IconCertificate,
  '설비관리': IconSettings,
};

const ACCENT = '#5b7fc7';

export default function Sidebar({ menuData = MENU_DATA, mobileOpen = false, onCloseMobile }) {
  const [collapsed, setCollapsed] = useState(false);
  // 첫 번째 그룹만 기본 펼침
  const [openGroups, setOpenGroups] = useState(() => new Set([menuData[0]?.category]));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const toggleGroup = (category) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      next.has(category) ? next.delete(category) : next.add(category);
      return next;
    });
  };

  const goTo = (path) => {
    navigate(path);
    onCloseMobile?.();
  };

  const handleLogout = () => {
    if (window.confirm('로그아웃하시겠습니까?')) {
      logout();
      navigate('/login', { replace: true });
    }
  };

  const userName = user?.userName ?? '';
  const userDept = user?.deptName ?? '';
  const userInitial = userName ? userName.slice(0, 1) : '';

  return (
    <>
      {mobileOpen && <div className="mes-sidebar-backdrop" onClick={onCloseMobile} />}
      <div
        className={`mes-sidebar${mobileOpen ? ' mes-sidebar--mobile-open' : ''}`}
        style={{
          width: collapsed ? 60 : 236,
          flexShrink: 0,
          background: '#15171c',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width .2s cubic-bezier(.4,0,.2,1)',
          height: '100%',
        }}
      >
        {/* 로고 + 토글 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 16px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7, flexShrink: 0,
              background: 'linear-gradient(135deg,#3d5a99,#2c3e5f)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <IconHexagon size={15} color="#cdd8ee" />
            </div>
            {!collapsed && (
              <span style={{ fontSize: 14, fontWeight: 500, color: '#f2f3f5', whiteSpace: 'nowrap', letterSpacing: .2 }}>
                SMART MES
              </span>
            )}
          </div>
          <button
            className="mes-sidebar-collapse-btn"
            onClick={() => setCollapsed(c => !c)}
            aria-label={collapsed ? '메뉴 펼치기' : '메뉴 접기'}
            style={{
              border: 'none', background: 'transparent', borderRadius: 6,
              width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', padding: 0, color: '#6b7280', flexShrink: 0,
            }}
          >
            {collapsed ? <IconChevronRight size={15} /> : <IconChevronLeft size={15} />}
          </button>
        </div>

        <div style={{ height: 1, margin: '0 16px 8px', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.08),transparent)' }} />

        {/* 메뉴 영역 (스크롤바 숨김) */}
        <div
          className="mes-sidebar-scroll"
          style={{ flex: 1, overflowY: 'auto', padding: '6px 10px 10px' }}
        >
          {menuData.map(group => {
            const Icon = CATEGORY_ICONS[group.category] ?? IconDatabase;
            const isOpen = openGroups.has(group.category);
            return (
              <div key={group.category} style={{ marginBottom: 2 }}>
                <button
                  onClick={() => toggleGroup(group.category)}
                  aria-expanded={isOpen}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 8px', background: 'transparent', border: 'none',
                    borderRadius: 7, cursor: 'pointer', color: '#d1d5db',
                    fontSize: 12.5, fontWeight: 500, textAlign: 'left', letterSpacing: .1,
                    transition: 'background .12s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Icon size={16} style={{ flexShrink: 0, color: '#8b90a0' }} />
                  {!collapsed && <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden' }}>{group.category}</span>}
                  {!collapsed && (
                    <IconChevronDown
                      size={12}
                      style={{ color: '#5b6070', transition: 'transform .18s', transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                    />
                  )}
                </button>

                {!collapsed && isOpen && (
                  <div style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {group.menus.map(item => {
                      const active = location.pathname === item.path;
                      return (
                        <button
                          key={item.path}
                          onClick={() => goTo(item.path)}
                          style={{
                            width: '100%', textAlign: 'left', padding: '7px 10px',
                            fontSize: 12.5, background: active ? `${ACCENT}22` : 'transparent',
                            color: active ? '#c3d0f0' : '#9199a8',
                            fontWeight: active ? 500 : 400,
                            border: 'none', borderLeft: `2px solid ${active ? ACCENT : 'transparent'}`,
                            borderRadius: '0 6px 6px 0', cursor: 'pointer',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            transition: 'background .12s, color .12s',
                          }}
                          onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,.035)'; e.currentTarget.style.color = '#d1d5db'; } }}
                          onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9199a8'; } }}
                        >
                          {item.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 하단 사용자 정보 */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 26, height: 26, borderRadius: '50%', background: '#2a2d35', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500, color: '#9ca3af',
          }}>
            {userInitial}
          </div>
          {!collapsed && (
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontSize: 12, color: '#e5e7eb', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userName}</div>
              <div style={{ fontSize: 11, color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userDept}</div>
            </div>
          )}
          <button
            onClick={handleLogout}
            aria-label="로그아웃"
            title="로그아웃"
            style={{
              border: 'none', background: 'transparent', borderRadius: 6,
              width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', padding: 0, color: '#6b7280', flexShrink: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#dc4c4c'}
            onMouseLeave={e => e.currentTarget.style.color = '#6b7280'}
          >
            <IconLogout size={15} />
          </button>
        </div>

        <style>{`
          .mes-sidebar-scroll::-webkit-scrollbar { display: none; }
          .mes-sidebar-scroll { scrollbar-width: none; -ms-overflow-style: none; }

          .mes-sidebar-backdrop { display: none; }

          @media (max-width: 768px) {
            .mes-sidebar {
              position: fixed;
              top: 0;
              left: 0;
              bottom: 0;
              z-index: 1100;
              width: 260px !important;
              transform: translateX(-100%);
              transition: transform .22s ease;
            }
            .mes-sidebar--mobile-open {
              transform: translateX(0);
            }
            .mes-sidebar-collapse-btn {
              display: none;
            }
            .mes-sidebar-backdrop {
              display: block;
              position: fixed;
              inset: 0;
              background: rgba(0,0,0,.45);
              z-index: 1050;
            }
          }
        `}</style>
      </div>
    </>
  );
}
