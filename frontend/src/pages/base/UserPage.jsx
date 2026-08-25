import { useCallback, useEffect, useMemo, useState } from 'react';
import { IconPlus, IconSearch, IconUsers, IconUserCheck, IconUserOff } from '@tabler/icons-react';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';
import { useToast } from '../../hooks/useToast';
import { getList, createUser, updateUser, deleteUser } from '../../api/base/userApi';

const EMPTY_FORM = {
  loginId: '',
  password: '',
  userName: '',
  deptName: '',
  phone: '',
  email: '',
  useYn: 'Y',
};

export default function UserPage() {
  const [users, setUsers] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast, showToast } = useToast();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getList({ page: 1, size: 1000 });
      setUsers(res.data?.content ?? []);
    } catch (e) {
      showToast('사용자 목록을 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    if (!keyword.trim()) return users;
    const k = keyword.trim().toLowerCase();
    return users.filter(
      (u) => u.loginId?.toLowerCase().includes(k) || u.userName?.toLowerCase().includes(k)
    );
  }, [users, keyword]);

  const openCreate = () => {
    setEditingUser(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setForm({
      loginId: user.loginId ?? '',
      password: '',
      userName: user.userName ?? '',
      deptName: user.deptName ?? '',
      phone: user.phone ?? '',
      email: user.email ?? '',
      useYn: user.useYn ?? 'Y',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`'${user.userName}(${user.loginId})' 사용자를 삭제하시겠습니까?`)) return;
    try {
      await deleteUser(user.userId);
      showToast('삭제되었습니다.');
      fetchUsers();
    } catch (e) {
      showToast(e.response?.data?.message ?? '삭제에 실패했습니다.', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!editingUser && (!form.loginId.trim() || !form.password.trim())) {
      setFormError('아이디와 비밀번호는 필수입니다.');
      return;
    }
    if (!form.userName.trim()) {
      setFormError('이름은 필수입니다.');
      return;
    }
    setSaving(true);
    try {
      if (editingUser) {
        await updateUser(editingUser.userId, form);
        showToast('수정되었습니다.');
      } else {
        await createUser(form);
        showToast('등록되었습니다.');
      }
      setModalOpen(false);
      fetchUsers();
    } catch (e) {
      setFormError(e.response?.data?.message ?? '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const stats = useMemo(() => {
    const active = users.filter((u) => u.useYn === 'Y').length;
    return { total: users.length, active, inactive: users.length - active };
  }, [users]);

  const columns = useMemo(
    () => [
      {
        title: '사용자',
        field: 'userName',
        minWidth: 180,
        formatter: (cell) => {
          const row = cell.getRow().getData();
          const initial = (row.userName ?? '?').slice(0, 1);
          return `<div class="mes-identity-cell">
              <div class="mes-avatar">${initial}</div>
              <div class="mes-identity-text">
                <div class="mes-identity-name">${row.userName ?? ''}</div>
                <div class="mes-identity-sub">${row.loginId ?? ''}</div>
              </div>
            </div>`;
        },
      },
      { title: '부서', field: 'deptName', width: 140 },
      { title: '연락처', field: 'phone', width: 130 },
      { title: '이메일', field: 'email', minWidth: 160 },
      {
        title: '상태',
        field: 'useYn',
        width: 90,
        hozAlign: 'center',
        formatter: (cell) => {
          const on = cell.getValue() === 'Y';
          return `<span class="mes-badge ${on ? 'mes-badge-success' : 'mes-badge-danger'}">${on ? '사용' : '중지'}</span>`;
        },
      },
      {
        title: '등록일',
        field: 'regDt',
        width: 150,
        formatter: (cell) => (cell.getValue() ? String(cell.getValue()).replace('T', ' ').slice(0, 16) : ''),
      },
      {
        title: '관리',
        field: 'userId',
        width: 120,
        hozAlign: 'center',
        headerSort: false,
        formatter: () =>
          '<div class="mes-row-actions"><button class="mes-btn mes-btn-ghost tbl-edit">수정</button><button class="mes-btn mes-btn-ghost tbl-delete">삭제</button></div>',
        cellClick: (e, cell) => {
          const btn = e.target.closest('button');
          if (!btn) return;
          const row = cell.getRow().getData();
          if (btn.classList.contains('tbl-edit')) openEdit(row);
          if (btn.classList.contains('tbl-delete')) handleDelete(row);
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <div className="mes-page">
      <div className="mes-page-header">
        <div className="mes-page-heading">
          <div className="mes-page-icon">
            <IconUsers size={20} />
          </div>
          <div>
            <h2 className="mes-page-title">사용자관리</h2>
            <p className="mes-page-desc">시스템에 접속하는 사용자 계정을 등록·관리합니다.</p>
          </div>
        </div>
        <button className="mes-btn mes-btn-primary" onClick={openCreate}>
          <IconPlus size={16} /> 사용자 등록
        </button>
      </div>

      <div className="mes-stat-grid">
        <div className="mes-stat-card">
          <div className="mes-stat-icon" style={{ background: 'var(--mes-accent-soft)', color: 'var(--mes-accent-dark)' }}>
            <IconUsers size={17} />
          </div>
          <div>
            <div className="mes-stat-value">{stats.total}</div>
            <div className="mes-stat-label">전체 사용자</div>
          </div>
        </div>
        <div className="mes-stat-card">
          <div className="mes-stat-icon" style={{ background: 'var(--mes-success-soft)', color: 'var(--mes-success)' }}>
            <IconUserCheck size={17} />
          </div>
          <div>
            <div className="mes-stat-value">{stats.active}</div>
            <div className="mes-stat-label">사용 중</div>
          </div>
        </div>
        <div className="mes-stat-card">
          <div className="mes-stat-icon" style={{ background: 'var(--mes-danger-soft)', color: 'var(--mes-danger)' }}>
            <IconUserOff size={17} />
          </div>
          <div>
            <div className="mes-stat-value">{stats.inactive}</div>
            <div className="mes-stat-label">중지</div>
          </div>
        </div>
      </div>

      <div className="mes-card">
        <div className="mes-toolbar">
          <div className="mes-search">
            <IconSearch size={15} />
            <input
              placeholder="아이디 또는 이름 검색"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <span className="mes-page-desc">{loading ? '불러오는 중...' : `총 ${filteredUsers.length}명`}</span>
        </div>
        <DataTable data={filteredUsers} columns={columns} />
      </div>

      {modalOpen && (
        <Modal
          title={editingUser ? '사용자 수정' : '사용자 등록'}
          onClose={() => setModalOpen(false)}
          large
        >
          <form onSubmit={handleSubmit}>
            <div className="mes-form-grid">
              <div className="mes-field">
                <label>아이디</label>
                <input
                  value={form.loginId}
                  disabled={!!editingUser}
                  onChange={(e) => setForm({ ...form, loginId: e.target.value })}
                  placeholder="로그인에 사용할 아이디"
                />
              </div>
              <div className="mes-field">
                <label>비밀번호{editingUser && ' (변경 시에만 입력)'}</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={editingUser ? '변경하지 않으면 비워두세요' : ''}
                />
              </div>
              <div className="mes-field">
                <label>이름</label>
                <input value={form.userName} onChange={(e) => setForm({ ...form, userName: e.target.value })} />
              </div>
              <div className="mes-field">
                <label>부서</label>
                <input value={form.deptName} onChange={(e) => setForm({ ...form, deptName: e.target.value })} />
              </div>
              <div className="mes-field">
                <label>연락처</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="010-0000-0000" />
              </div>
              <div className="mes-field">
                <label>이메일</label>
                <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@company.com" />
              </div>
              <div className="mes-field mes-field-full">
                <label>사용 여부</label>
                <select value={form.useYn} onChange={(e) => setForm({ ...form, useYn: e.target.value })}>
                  <option value="Y">사용</option>
                  <option value="N">중지</option>
                </select>
              </div>
            </div>
            {formError && <div className="mes-error" style={{ marginTop: 4 }}>{formError}</div>}
            <div className="mes-modal-footer">
              <button type="button" className="mes-btn mes-btn-secondary" onClick={() => setModalOpen(false)}>
                취소
              </button>
              <button type="submit" className="mes-btn mes-btn-primary" disabled={saving}>
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <Toast toast={toast} />
    </div>
  );
}
