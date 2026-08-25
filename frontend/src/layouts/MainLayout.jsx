import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { IconMenu2 } from '@tabler/icons-react';
import Sidebar from '../components/Sidebar';

export default function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div className="mes-mobile-header">
          <button
            className="mes-mobile-header-btn"
            onClick={() => setMobileOpen(true)}
            aria-label="메뉴 열기"
          >
            <IconMenu2 size={20} />
          </button>
          <span className="mes-mobile-header-title">SMART MES</span>
        </div>

        <div style={{ flex: 1, overflow: 'auto', background: '#f5f6f8' }}>
          <Outlet />
        </div>
      </div>

      <style>{`
        .mes-mobile-header {
          display: none;
        }
        @media (max-width: 768px) {
          .mes-mobile-header {
            display: flex;
            align-items: center;
            gap: 12px;
            height: 52px;
            flex-shrink: 0;
            padding: 0 14px;
            background: #15171c;
            color: #f2f3f5;
          }
          .mes-mobile-header-btn {
            border: none;
            background: transparent;
            color: #d1d5db;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 4px;
            cursor: pointer;
          }
          .mes-mobile-header-title {
            font-size: 14px;
            font-weight: 600;
            letter-spacing: .2px;
          }
        }
      `}</style>
    </div>
  );
}
