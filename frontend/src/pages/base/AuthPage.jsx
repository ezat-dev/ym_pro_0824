import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { IconDeviceFloppy, IconCheck, IconX, IconShieldLock, IconSearch } from '@tabler/icons-react';
import DataTable from '../../components/ui/DataTable';
import Toast from '../../components/ui/Toast';
import { useToast } from '../../hooks/useToast';
import { getList as getUserList } from '../../api/base/userApi';
import { getAuthMenuItems, saveAuthMenuItems } from '../../api/base/authApi';

// 헤더를 클릭하면 해당 권한 컬럼 전체를 켜기/끄기 토글한다(현재 다수결 상태의 반대로 전환).
function makeSwitchColumn(title, field, tableRef) {
  return {
    title,
    field,
    width: 92,
    hozAlign: 'center',
    headerHozAlign: 'center',
    headerSort: false,
    cssClass: 'mes-perm-col',
    formatter: (cell) => {
      const on = !!cell.getValue();
      return `<button type="button" class="mes-switch${on ? ' on' : ''}" aria-pressed="${on}"><span class="mes-switch-knob"></span></button>`;
    },
    cellClick: (e, cell) => {
      cell.setValue(!cell.getValue());
    },
    headerClick: () => {
      const table = tableRef.current;
      if (!table) return;
      const data = table.getData();
      const allOn = data.length > 0 && data.every((row) => row[field]);
      table.replaceData(data.map((row) => ({ ...row, [field]: !allOn })));
    },
  };
}

export default function AuthPage() {
  const [users, setUsers] = useState([]);
  const [userKeyword, setUserKeyword] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const tableRef = useRef(null);
  const { toast, showToast } = useToast();

  useEffect(() => {
    getUserList({ page: 1, size: 1000 }).then((res) => {
      const list = res.data?.content ?? [];
      setUsers(list);
      if (list.length > 0) setSelectedUserId(String(list[0].userId));
    });
  }, []);

  const loadAuth = useCallback(async (userId) => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await getAuthMenuItems(userId);
      setItems(res.data ?? []);
    } catch (e) {
      showToast('권한 정보를 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedUserId) loadAuth(selectedUserId);
  }, [selectedUserId, loadAuth]);

  const filteredUsers = useMemo(() => {
    if (!userKeyword.trim()) return users;
    const k = userKeyword.trim().toLowerCase();
    return users.filter((u) => u.loginId?.toLowerCase().includes(k) || u.userName?.toLowerCase().includes(k));
  }, [users, userKeyword]);

  const selectedUser = useMemo(
    () => users.find((u) => String(u.userId) === String(selectedUserId)),
    [users, selectedUserId]
  );

  const bulkUpdate = (patch) => {
    const table = tableRef.current;
    if (!table) return;
    const updated = table.getData().map((row) => ({ ...row, ...patch }));
    table.replaceData(updated);
  };

  const handleSave = async () => {
    const table = tableRef.current;
    if (!table || !selectedUserId) return;
    setSaving(true);
    try {
      await saveAuthMenuItems(selectedUserId, table.getData());
      showToast('권한이 저장되었습니다.');
    } catch (e) {
      showToast(e.response?.data?.message ?? '저장에 실패했습니다.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo(
    () => [
      { title: '메뉴명', field: 'menuName', minWidth: 160, headerSort: false },
      { title: '경로', field: 'menuPath', minWidth: 150, headerSort: false },
      makeSwitchColumn('등록(C)', 'canCreate', tableRef),
      makeSwitchColumn('조회(R)', 'canRead', tableRef),
      makeSwitchColumn('수정(U)', 'canUpdate', tableRef),
      makeSwitchColumn('삭제(D)', 'canDelete', tableRef),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <div className="mes-page">
      <div className="mes-page-header">
        <div className="mes-page-heading">
          <div className="mes-page-icon">
            <IconShieldLock size={20} />
          </div>
          <div>
            <h2 className="mes-page-title">사용자권한</h2>
            <p className="mes-page-desc">
              사용자를 선택하고 메뉴별 등록·조회·수정·삭제 권한을 스위치로 켜고 꺼서 저장합니다. 열 제목을 클릭하면 그 권한 전체를 한 번에 토글합니다.
            </p>
          </div>
        </div>
        <button className="mes-btn mes-btn-primary" onClick={handleSave} disabled={saving || !selectedUserId}>
          <IconDeviceFloppy size={16} /> {saving ? '저장 중...' : '권한 저장'}
        </button>
      </div>

      <div className="mes-auth-layout">
        <div className="mes-user-panel">
          <div className="mes-user-panel-title">사용자 선택</div>
          <div className="mes-search" style={{ maxWidth: 'none' }}>
            <IconSearch size={15} />
            <input
              placeholder="아이디 또는 이름 검색"
              value={userKeyword}
              onChange={(e) => setUserKeyword(e.target.value)}
            />
          </div>
          <div className="mes-user-list">
            {filteredUsers.length === 0 && <div className="mes-user-list-empty">사용자가 없습니다.</div>}
            {filteredUsers.map((u) => (
              <button
                key={u.userId}
                className={`mes-user-list-item${String(u.userId) === String(selectedUserId) ? ' active' : ''}`}
                onClick={() => setSelectedUserId(String(u.userId))}
              >
                <div className="mes-avatar">{u.userName?.slice(0, 1)}</div>
                <div style={{ overflow: 'hidden' }}>
                  <div className="mes-user-name">{u.userName}</div>
                  <div className="mes-user-id">{u.loginId}{u.deptName ? ` · ${u.deptName}` : ''}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mes-card" style={{ flex: 1, minWidth: 0 }}>
          <div className="mes-toolbar">
            <span className="mes-page-desc">
              {selectedUser ? (
                <>
                  <strong style={{ color: 'var(--mes-text)' }}>{selectedUser.userName}</strong>
                  {' '}({selectedUser.loginId})님의 메뉴별 권한
                </>
              ) : (
                '사용자를 선택해주세요'
              )}
            </span>
            <div className="mes-row-actions">
              <button className="mes-btn mes-btn-secondary" onClick={() => bulkUpdate({ canRead: true })}>
                <IconCheck size={14} /> 조회 전체허용
              </button>
              <button
                className="mes-btn mes-btn-secondary"
                onClick={() => bulkUpdate({ canCreate: false, canRead: false, canUpdate: false, canDelete: false })}
              >
                <IconX size={14} /> 전체 해제
              </button>
            </div>
          </div>
          {loading ? (
            <p className="mes-page-desc">불러오는 중...</p>
          ) : (
            <DataTable
              data={items}
              columns={columns}
              options={{ index: 'menuPath', groupBy: 'category', pagination: false }}
              height="600px"
              onTableReady={(t) => { tableRef.current = t; }}
            />
          )}
        </div>
      </div>

      <Toast toast={toast} />
    </div>
  );
}
