import { createContext, useContext, useState } from 'react';

const SidebarContext = createContext(null);

// 사이드바 접힘 상태를 전역으로 두는 이유: 일상점검일지의 "태블릿 모드"처럼
// 특정 화면이 자기 그리드 공간을 넓히려고 사이드바를 직접 접어야 하는 경우가 있어서다.
export function SidebarProvider({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  return <SidebarContext.Provider value={{ collapsed, setCollapsed }}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error('useSidebar는 SidebarProvider 내부에서만 사용할 수 있습니다.');
  }
  return ctx;
}
