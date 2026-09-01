import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAuthMenuItems } from '../api/base/authApi';

const ALL_DENIED = { canCreate: false, canRead: false, canUpdate: false, canDelete: false };

// 로그인 사용자의 menuPath별 CRUD 권한을 조회한다. 조회 완료 전(loading:true)에는
// 전부 false로 두어, 응답이 오기 전 잠깐이라도 편집이 가능해 보이는 순간이 없게 한다.
export function usePermission(menuPath) {
  const { user } = useAuth();
  const [state, setState] = useState({ ...ALL_DENIED, loading: true });

  useEffect(() => {
    let cancelled = false;
    if (!user?.userId) {
      setState({ ...ALL_DENIED, loading: false });
      return undefined;
    }
    setState((s) => ({ ...s, loading: true }));
    getAuthMenuItems(user.userId)
      .then((res) => {
        if (cancelled) return;
        const items = res.data ?? [];
        const found = items.find((it) => it.menuPath === menuPath);
        setState({
          canCreate: !!found?.canCreate,
          canRead: !!found?.canRead,
          canUpdate: !!found?.canUpdate,
          canDelete: !!found?.canDelete,
          loading: false,
        });
      })
      .catch(() => {
        if (!cancelled) setState({ ...ALL_DENIED, loading: false });
      });
    return () => {
      cancelled = true;
    };
  }, [user?.userId, menuPath]);

  return state;
}
