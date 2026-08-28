import { Fragment, useEffect, useMemo, useState, useCallback } from 'react';
import {
  IconDeviceFloppy, IconCheck, IconChecks, IconX, IconShieldLock, IconSearch, IconUsers,
  IconDatabase, IconActivity, IconClipboardList, IconAdjustments, IconCertificate, IconSettings,
} from '@tabler/icons-react';
import Toast from '../../components/ui/Toast';
import { useToast } from '../../hooks/useToast';
import { getList as getUserList } from '../../api/base/userApi';
import { getAuthMenuItems, saveAuthMenuItems } from '../../api/base/authApi';

const PERM_COLUMNS = [
  { field: 'canCreate', label: '등록(C)' },
  { field: 'canRead', label: '조회(R)' },
  { field: 'canUpdate', label: '수정(U)' },
  { field: 'canDelete', label: '삭제(D)' },
];

// 사이드바 대분류 아이콘과 동일한 매핑 — 권한 그리드 그룹 행에서도 한눈에 알아보게.
const CATEGORY_ICONS = {
  '기준정보': IconDatabase,
  '모니터링': IconActivity,
  '생산관리': IconClipboardList,
  '조건관리': IconAdjustments,
  '품질관리': IconCertificate,
  '설비관리': IconSettings,
};

function PermSwitch({ on, onClick, title }) {
  return (
    <button type="button" className={`mes-switch${on ? ' on' : ''}`} aria-pressed={on} title={title} onClick={onClick}>
      <span className="mes-switch-knob" />
    </button>
  );
}

export default function AuthPage() {
  const [users, setUsers] = useState([]);
  const [userKeyword, setUserKeyword] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
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

  const groupedItems = useMemo(() => {
    const map = new Map();
    items.forEach((it) => {
      const cat = it.category || '기타';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat).push(it);
    });
    return Array.from(map.entries());
  }, [items]);

  // 툴바에 "N개 메뉴 중 M개 권한 활성" 요약을 보여주기 위한 카운트.
  const permSummary = useMemo(() => {
    const onCount = items.reduce(
      (s, it) => s + PERM_COLUMNS.filter((c) => it[c.field]).length,
      0
    );
    return { menuCount: items.length, onCount, totalCount: items.length * PERM_COLUMNS.length };
  }, [items]);

  const toggleCell = (menuPath, field) => {
    setItems((prev) => prev.map((it) => (it.menuPath === menuPath ? { ...it, [field]: !it[field] } : it)));
  };

  // 헤더 클릭 시 해당 권한 컬럼 전체를 토글한다(현재 다수결 상태의 반대로 전환).
  const toggleColumn = (field) => {
    setItems((prev) => {
      const allOn = prev.length > 0 && prev.every((it) => it[field]);
      return prev.map((it) => ({ ...it, [field]: !allOn }));
    });
  };

  const bulkUpdate = (patch) => {
    setItems((prev) => prev.map((it) => ({ ...it, ...patch })));
  };

  const handleSave = async () => {
    if (!selectedUserId) return;
    setSaving(true);
    try {
      await saveAuthMenuItems(selectedUserId, items);
      showToast('권한이 저장되었습니다.');
    } catch (e) {
      showToast(e.response?.data?.message ?? '저장에 실패했습니다.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mes-page mes-page-fill">
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
          <div className="mes-user-panel-title">
            <span>사용자 선택</span>
            <span className="mes-user-panel-count">{filteredUsers.length}명</span>
          </div>
          <div className="mes-search" style={{ maxWidth: 'none', flex: '0 0 auto' }}>
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

        <div className="mes-card mes-card-fill">
          <div className="mes-toolbar">
            <span className="mes-page-desc">
              {selectedUser ? (
                <>
                  <strong style={{ color: 'var(--mes-text)' }}>{selectedUser.userName}</strong>
                  {' '}({selectedUser.loginId})님의 메뉴별 권한
                  {items.length > 0 && (
                    <span className="mes-auth-summary">
                      메뉴 {permSummary.menuCount}개 · 권한 {permSummary.onCount}/{permSummary.totalCount} 활성
                    </span>
                  )}
                </>
              ) : (
                '사용자를 선택해주세요'
              )}
            </span>
            <div className="mes-row-actions">
              <button
                className="mes-btn mes-btn-secondary"
                onClick={() => bulkUpdate({ canCreate: true, canRead: true, canUpdate: true, canDelete: true })}
              >
                <IconChecks size={14} /> 모든 권한 허용
              </button>
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
            <div className="mes-table-scroll">
              <table className="mes-plain-table mes-table-fixed">
                <colgroup>
                  <col style={{ width: '30%' }} />
                  <col />
                  {PERM_COLUMNS.map((c) => <col key={c.field} style={{ width: '92px' }} />)}
                </colgroup>
                <thead>
                  <tr>
                    <th>메뉴명</th>
                    <th>경로</th>
                    {PERM_COLUMNS.map((c) => (
                      <th
                        key={c.field}
                        className="sortable"
                        style={{ textAlign: 'center' }}
                        title="클릭하면 전체 토글"
                        onClick={() => toggleColumn(c.field)}
                      >
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 && (
                    <tr><td colSpan={2 + PERM_COLUMNS.length} className="mes-table-empty">표시할 메뉴가 없습니다.</td></tr>
                  )}
                  {groupedItems.map(([category, rows]) => {
                    const CategoryIcon = CATEGORY_ICONS[category] ?? IconDatabase;
                    return (
                    <Fragment key={category}>
                      <tr className="mes-group-row">
                        <td colSpan={2 + PERM_COLUMNS.length}>
                          <span className="mes-auth-group-label">
                            <CategoryIcon size={14} />
                            {category}
                          </span>
                        </td>
                      </tr>
                      {rows.map((it) => (
                        <tr key={it.menuPath}>
                          <td>{it.menuName}</td>
                          <td className="truncate">{it.menuPath}</td>
                          {PERM_COLUMNS.map((c) => (
                            <td key={c.field} style={{ textAlign: 'center' }}>
                              <PermSwitch on={!!it[c.field]} onClick={() => toggleCell(it.menuPath, c.field)} title={c.label} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Toast toast={toast} />
    </div>
  );
}
