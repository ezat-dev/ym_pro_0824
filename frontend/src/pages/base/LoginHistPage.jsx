import { useCallback, useEffect, useMemo, useState } from 'react';
import { IconSearch, IconRefresh, IconHistory, IconCircleCheck, IconCircleX } from '@tabler/icons-react';
import DataTable from '../../components/ui/DataTable';
import Toast from '../../components/ui/Toast';
import { useToast } from '../../hooks/useToast';
import { getList } from '../../api/base/loginHistApi';

export default function LoginHistPage() {
  const [rows, setRows] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast, showToast } = useToast();

  const fetchHist = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getList({ page: 1, size: 1000 });
      setRows(res.data?.content ?? []);
    } catch (e) {
      showToast('로그인 이력을 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchHist();
  }, [fetchHist]);

  const filtered = useMemo(() => {
    if (!keyword.trim()) return rows;
    const k = keyword.trim().toLowerCase();
    return rows.filter((r) => r.loginId?.toLowerCase().includes(k) || r.userName?.toLowerCase().includes(k));
  }, [rows, keyword]);

  const stats = useMemo(() => {
    const success = rows.filter((r) => r.successYn === 'Y').length;
    return { total: rows.length, success, fail: rows.length - success };
  }, [rows]);

  const columns = useMemo(
    () => [
      {
        title: '로그인 일시', field: 'loginDt', width: 170,
        formatter: (cell) => (cell.getValue() ? String(cell.getValue()).replace('T', ' ').slice(0, 19) : ''),
      },
      { title: '아이디', field: 'loginId', width: 130 },
      { title: '이름', field: 'userName', width: 110 },
      { title: '접속 IP', field: 'loginIp', width: 150 },
      {
        title: '결과', field: 'successYn', width: 90, hozAlign: 'center',
        formatter: (cell) => {
          const ok = cell.getValue() === 'Y';
          return `<span class="mes-badge ${ok ? 'mes-badge-success' : 'mes-badge-danger'}">${ok ? '성공' : '실패'}</span>`;
        },
      },
      { title: '실패 사유', field: 'failReason', minWidth: 160 },
    ],
    []
  );

  return (
    <div className="mes-page">
      <div className="mes-page-header">
        <div className="mes-page-heading">
          <div className="mes-page-icon">
            <IconHistory size={20} />
          </div>
          <div>
            <h2 className="mes-page-title">로그인이력</h2>
            <p className="mes-page-desc">로그인 성공/실패 시도가 자동으로 기록됩니다.</p>
          </div>
        </div>
        <button className="mes-btn mes-btn-secondary" onClick={fetchHist}>
          <IconRefresh size={16} /> 새로고침
        </button>
      </div>

      <div className="mes-stat-grid">
        <div className="mes-stat-card">
          <div className="mes-stat-icon" style={{ background: 'var(--mes-accent-soft)', color: 'var(--mes-accent-dark)' }}>
            <IconHistory size={17} />
          </div>
          <div>
            <div className="mes-stat-value">{stats.total}</div>
            <div className="mes-stat-label">전체 시도</div>
          </div>
        </div>
        <div className="mes-stat-card">
          <div className="mes-stat-icon" style={{ background: 'var(--mes-success-soft)', color: 'var(--mes-success)' }}>
            <IconCircleCheck size={17} />
          </div>
          <div>
            <div className="mes-stat-value">{stats.success}</div>
            <div className="mes-stat-label">성공</div>
          </div>
        </div>
        <div className="mes-stat-card">
          <div className="mes-stat-icon" style={{ background: 'var(--mes-danger-soft)', color: 'var(--mes-danger)' }}>
            <IconCircleX size={17} />
          </div>
          <div>
            <div className="mes-stat-value">{stats.fail}</div>
            <div className="mes-stat-label">실패</div>
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
          <span className="mes-page-desc">{loading ? '불러오는 중...' : `총 ${filtered.length}건`}</span>
        </div>
        <DataTable data={filtered} columns={columns} />
      </div>

      <Toast toast={toast} />
    </div>
  );
}
