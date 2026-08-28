import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  IconAlertTriangle, IconPlus, IconFolderPlus, IconSettings, IconLayoutDashboard,
  IconGauge, IconBellRinging, IconChartAreaLine, IconStopwatch,
} from '@tabler/icons-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LabelList, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
} from 'recharts';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';
import { useToast } from '../../hooks/useToast';
import {
  getFolders, createFolder, deleteFolder,
  getTags, createTag, updateTag, deleteTag,
  getPlcs, getActive, getHistory, getMessageCountsByFolder,
  getTrendBySeverity, getResponseTimeTrend,
} from '../../api/monitoring/alarmApi';
import './AlarmPage.css';

const EMPTY_TAG = { tagName: '', address: '', plcId: '', alarmMsg: '', level: 1, enabled: 1 };
const SEV_COLORS = { 1: '#5b8def', 2: '#f5a623', 3: '#e0483f' };
const RECENT_HOURS_OPTIONS = [6, 12, 24];

function fmtDt(s) {
  return String(s ?? '').replace('T', ' ').slice(0, 19);
}

function timeAgo(s) {
  if (!s) return '';
  const diffMin = Math.floor((Date.now() - new Date(s).getTime()) / 60000);
  if (diffMin < 1) return '방금';
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}시간 전`;
  return `${Math.floor(diffHr / 24)}일 전`;
}

export default function AlarmPage() {
  const [tab, setTab] = useState('dashboard'); // 'dashboard' | 'settings'

  // ── 대시보드 상태 ──
  const [active, setActive] = useState([]);
  // 현재 발생 중인 알람 목록의 "화면에 실제로 그려지는" 버전 — 해제된 알람을 나가는 애니메이션이
  // 끝날 때까지 잠깐 더 붙잡아 두기 위해 active와 분리했다.
  const [displayActive, setDisplayActive] = useState([]);
  const [exitingIds, setExitingIds] = useState(() => new Set()); // 지금 퇴장 애니메이션 재생 중인 historyId
  const [newIds, setNewIds] = useState(() => new Set()); // 방금 새로 발생해 입장 애니메이션 재생 중인 historyId
  const [freshIds, setFreshIds] = useState(() => new Set()); // 최근 알람 쪽에 막 도착해 강조 중인 historyId
  const [justCleared, setJustCleared] = useState([]); // 방금 해제돼 최근 알람에 낙관적으로 합쳐 넣은 알람들
  const prevActiveRef = useRef([]);
  const [history, setHistory] = useState([]);
  const [messageCounts, setMessageCounts] = useState([]); // 설비×메시지 건수(최근 1개월)
  const [severityTrend, setSeverityTrend] = useState([]); // 시간대×레벨별 건수(최근 24h, 서버 집계)
  const [responseTrend, setResponseTrend] = useState([]); // 시간대별 평균 응답(해제 소요) 시간

  // 최근 알람 — 자체 설비 필터 + 6/12/24시간 선택
  const [recentFolderId, setRecentFolderId] = useState('');
  const [recentHours, setRecentHours] = useState(6);

  // ── 설정 탭 상태 ──
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [tags, setTags] = useState([]);
  const [plcs, setPlcs] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_TAG);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast, showToast } = useToast();

  const fetchActive = useCallback(async () => {
    try {
      const res = await getActive(200);
      const next = res.data ?? [];
      const nextIds = new Set(next.map((a) => a.historyId));
      const prevList = prevActiveRef.current;
      const prevIds = new Set(prevList.map((a) => a.historyId));
      const cleared = prevList.filter((a) => !nextIds.has(a.historyId));
      const added = next.filter((a) => !prevIds.has(a.historyId));

      // 새로 발생한 알람에 입장 애니메이션 표시 — 최초 마운트(prevList가 비어있는 첫 폴링)는
      // "지금 막 발생"이 아니라 그냥 초기 로딩이므로 애니메이션 대상에서 제외한다.
      const flashNew = (arrivals) => {
        if (!arrivals.length) return;
        const arrivalIds = new Set(arrivals.map((a) => a.historyId));
        setNewIds(arrivalIds);
        setTimeout(() => {
          setNewIds((prevNew) => {
            const n = new Set(prevNew);
            arrivalIds.forEach((id) => n.delete(id));
            return n;
          });
        }, 900);
      };

      if (cleared.length > 0 && prevList.length > 0) {
        // 1) 오른쪽(현재 발생 중) 목록에서 해제된 항목에 퇴장 애니메이션을 건다.
        const clearedIds = new Set(cleared.map((a) => a.historyId));
        setExitingIds(clearedIds);
        setTimeout(() => {
          // 2) 애니메이션이 끝난 뒤에야 실제로 오른쪽에서 제거하고, 같은 타이밍에
          //    왼쪽(최근 알람)에 도착시켜 "이동한" 것처럼 보이게 한다.
          setDisplayActive(next);
          setExitingIds(new Set());
          if (prevList.length > 0) flashNew(added);
          setJustCleared((prevJC) => [
            ...cleared.map((a) => ({ ...a, clearTime: a.clearTime ?? new Date().toISOString() })),
            ...prevJC,
          ].slice(0, 50));
          setFreshIds(clearedIds);
          setTimeout(() => {
            setFreshIds((prevFresh) => {
              const n = new Set(prevFresh);
              clearedIds.forEach((id) => n.delete(id));
              return n;
            });
          }, 1600);
        }, 420);
      } else {
        setDisplayActive(next);
        if (prevList.length > 0) flashNew(added);
      }

      prevActiveRef.current = next;
      setActive(next);
    } catch (e) {
      // 무시 — 2초마다 재시도
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await getHistory(500);
      setHistory(res.data ?? []);
    } catch (e) {
      showToast('알람 이력을 불러오지 못했습니다.', 'error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboardStats = useCallback(async () => {
    const now = new Date();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 3600000);
    const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
    try {
      const [msgRes, sevRes, respRes] = await Promise.all([
        getMessageCountsByFolder(fmt(monthAgo), fmt(now)),
        getTrendBySeverity(24),
        getResponseTimeTrend(24),
      ]);
      setMessageCounts(msgRes.data ?? []);
      setSeverityTrend(sevRes.data ?? []);
      setResponseTrend(respRes.data ?? []);
    } catch (e) {
      // 무시 — 30초마다 재시도
    }
  }, []);

  useEffect(() => {
    fetchActive();
    fetchHistory();
    fetchDashboardStats();
    const t = setInterval(fetchActive, 2000);
    const h = setInterval(fetchHistory, 30000);
    const s = setInterval(fetchDashboardStats, 30000);
    getPlcs().then((res) => setPlcs(res.data ?? [])).catch(() => {});
    getFolders().then((res) => setFolders(res.data ?? [])).catch(() => {});
    return () => { clearInterval(t); clearInterval(h); clearInterval(s); };
  }, [fetchActive, fetchHistory, fetchDashboardStats]);

  const fetchFolders = useCallback(async () => {
    try {
      const res = await getFolders();
      const list = res.data ?? [];
      setFolders(list);
      if (!selectedFolder && list.length) setSelectedFolder(list[0].folderId);
    } catch (e) {
      showToast('폴더 목록을 불러오지 못했습니다.', 'error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTags = useCallback(async (folderId) => {
    if (!folderId) { setTags([]); return; }
    try {
      const res = await getTags(folderId);
      setTags(res.data ?? []);
    } catch (e) {
      showToast('태그 목록을 불러오지 못했습니다.', 'error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tab === 'settings') fetchFolders();
  }, [tab, fetchFolders]);

  useEffect(() => {
    if (tab === 'settings') fetchTags(selectedFolder);
  }, [tab, selectedFolder, fetchTags]);

  // ── KPI ──
  const kpi = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const today = history.filter((h) => (h.occurTime ?? '').startsWith(todayStr)).length;
    const unacked = active.filter((h) => !h.ackTime).length;
    const clearedToday = history.filter((h) => h.clearTime && (h.clearTime ?? '').startsWith(todayStr)).length;
    return { activeCnt: active.length, today, unacked, clearedToday };
  }, [active, history]);

  // 설비×메시지 건수(folderId ASC, cnt DESC로 정렬돼 온다) 중 각 설비의 1위 메시지만 뽑아 건수순으로.
  // 카드 높이에 맞춰 상위 4개만 — 스크롤이 생기면 오히려 눈에 거슬려서 넘치는 나머지는 자른다.
  const topMsgByFolder = useMemo(() => {
    const seen = new Set();
    const top = [];
    messageCounts.forEach((row) => {
      if (!seen.has(row.folderId)) { seen.add(row.folderId); top.push(row); }
    });
    return top.sort((a, b) => b.cnt - a.cnt).slice(0, 4);
  }, [messageCounts]);

  const totalTrendCount = useMemo(
    () => severityTrend.reduce((s, r) => s + (r.total ?? 0), 0),
    [severityTrend]
  );

  const avgResponseOverall = useMemo(() => {
    const withData = responseTrend.filter((r) => r.avgMinutes != null && r.count > 0);
    if (!withData.length) return null;
    const totalMinutes = withData.reduce((s, r) => s + r.avgMinutes * r.count, 0);
    const totalCount = withData.reduce((s, r) => s + r.count, 0);
    return totalCount > 0 ? Math.round((totalMinutes / totalCount) * 10) / 10 : null;
  }, [responseTrend]);

  // 최근 알람 — 설비 필터 + N시간 이내. justCleared는 방금 해제되어 애니메이션으로 넘어온
  // 알람을 history가 다음 30초 폴링에서 실제로 받아올 때까지 낙관적으로 미리 보여준다
  // (historyId가 같으면 자연히 하나로 합쳐지므로 나중에 history가 갱신돼도 중복되지 않는다).
  const recentAlarms = useMemo(() => {
    const cutoff = Date.now() - recentHours * 3600000;
    const merged = new Map();
    history.forEach((a) => merged.set(a.historyId, a));
    justCleared.forEach((a) => { if (!merged.has(a.historyId)) merged.set(a.historyId, a); });
    return Array.from(merged.values())
      .filter((a) => {
        if (new Date(a.occurTime).getTime() < cutoff) return false;
        if (recentFolderId && String(a.folderId) !== String(recentFolderId)) return false;
        return true;
      })
      .sort((a, b) => new Date(b.occurTime).getTime() - new Date(a.occurTime).getTime());
  }, [history, justCleared, recentHours, recentFolderId]);

  // ── 설정 탭: 폴더/태그 CRUD ──
  const handleAddFolder = async () => {
    const name = window.prompt('새 폴더 이름');
    if (!name || !name.trim()) return;
    try {
      await createFolder(name.trim());
      showToast('폴더가 추가되었습니다.');
      fetchFolders();
    } catch (e) {
      showToast('폴더 추가에 실패했습니다.', 'error');
    }
  };

  const handleDeleteFolder = async (folderId, folderName) => {
    if (!window.confirm(`'${folderName}' 폴더를 삭제하시겠습니까? (하위 태그는 남습니다)`)) return;
    try {
      await deleteFolder(folderId);
      showToast('삭제되었습니다.');
      if (selectedFolder === folderId) setSelectedFolder(null);
      fetchFolders();
    } catch (e) {
      showToast('삭제에 실패했습니다.', 'error');
    }
  };

  const openCreateTag = () => {
    if (!selectedFolder) { showToast('먼저 폴더를 선택하세요.', 'error'); return; }
    setEditing(null);
    setForm({ ...EMPTY_TAG, folderId: selectedFolder });
    setFormError('');
    setModalOpen(true);
  };

  const openEditTag = (tag) => {
    setEditing(tag);
    setForm({
      folderId: tag.folderId,
      tagName: tag.tagName ?? '',
      address: tag.address ?? '',
      plcId: tag.plcId ?? '',
      alarmMsg: tag.alarmMsg ?? '',
      level: tag.level ?? 1,
      enabled: tag.enabled ?? 1,
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleDeleteTag = async (tag) => {
    if (!window.confirm(`'${tag.tagName}' 태그를 삭제하시겠습니까?`)) return;
    try {
      await deleteTag(tag.tagId);
      showToast('삭제되었습니다.');
      fetchTags(selectedFolder);
    } catch (e) {
      showToast('삭제에 실패했습니다.', 'error');
    }
  };

  const handleSubmitTag = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.tagName.trim()) { setFormError('태그 이름은 필수입니다.'); return; }
    if (!form.address.trim()) { setFormError('PLC 주소는 필수입니다.'); return; }
    if (!form.plcId.trim()) { setFormError('PLC는 필수입니다.'); return; }
    setSaving(true);
    try {
      if (editing) {
        await updateTag(editing.tagId, { ...form, folderId: editing.folderId });
        showToast('수정되었습니다.');
      } else {
        await createTag({ ...form, folderId: selectedFolder });
        showToast('등록되었습니다.');
      }
      setModalOpen(false);
      fetchTags(selectedFolder);
    } catch (e) {
      setFormError(e.response?.data?.message ?? '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const levelBadge = (level) => {
    const cls = level >= 3 ? 'mes-badge-danger' : level === 2 ? 'mes-badge-warning' : 'mes-badge-success';
    return `<span class="mes-badge ${cls}">Lv${level}</span>`;
  };

  const levelColor = (level) => (level >= 3 ? 'var(--mes-danger)' : level === 2 ? 'var(--mes-warning)' : 'var(--mes-success)');

  const tagColumns = useMemo(
    () => [
      { title: '태그명', field: 'tagName', minWidth: 160 },
      { title: '주소', field: 'address', width: 90 },
      { title: 'PLC', field: 'plcId', width: 140 },
      { title: '메시지', field: 'alarmMsg', minWidth: 180 },
      { title: '레벨', field: 'level', width: 70, hozAlign: 'center', formatter: (c) => levelBadge(c.getValue()) },
      {
        title: '사용', field: 'enabled', width: 70, hozAlign: 'center',
        formatter: (c) => `<span class="mes-badge ${c.getValue() === 1 ? 'mes-badge-success' : 'mes-badge-danger'}">${c.getValue() === 1 ? 'ON' : 'OFF'}</span>`,
      },
      {
        title: '관리', field: 'tagId', width: 110, hozAlign: 'center', headerSort: false,
        formatter: () => '<div class="mes-row-actions"><button class="mes-btn mes-btn-ghost tbl-edit">수정</button><button class="mes-btn mes-btn-ghost tbl-delete">삭제</button></div>',
        cellClick: (e, cell) => {
          const btn = e.target.closest('button');
          if (!btn) return;
          const row = cell.getRow().getData();
          if (btn.classList.contains('tbl-edit')) openEditTag(row);
          if (btn.classList.contains('tbl-delete')) handleDeleteTag(row);
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <div className="mes-page mes-page-fill alarm-page">
      <div className="mes-page-header">
        <div className="mes-page-heading">
          <div className="mes-page-icon alarm-page-icon">
            <IconAlertTriangle size={20} />
          </div>
          <div>
            <h2 className="mes-page-title">경보모니터링</h2>
            <p className="mes-page-desc">실시간 알람 대시보드</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className={tab === 'dashboard' ? 'mes-btn mes-btn-primary' : 'mes-btn mes-btn-secondary'}
            onClick={() => setTab('dashboard')}
          >
            <IconLayoutDashboard size={15} /> 모니터링
          </button>
          <button
            className={tab === 'settings' ? 'mes-btn mes-btn-primary' : 'mes-btn mes-btn-secondary'}
            onClick={() => setTab('settings')}
          >
            <IconSettings size={15} /> 태그 설정
          </button>
        </div>
      </div>

      {tab === 'dashboard' ? (
        <>
          <div className="mes-stat-grid">
            <div className="mes-stat-card alarm-kpi-card accent-danger">
              <div className="mes-stat-icon" style={{ background: 'var(--mes-danger-soft)', color: 'var(--mes-danger)' }}><IconAlertTriangle size={17} /></div>
              <div><div className="mes-stat-value">{kpi.activeCnt}</div><div className="mes-stat-label">활성 알람</div></div>
            </div>
            <div className="mes-stat-card alarm-kpi-card accent-accent">
              <div className="mes-stat-icon" style={{ background: 'var(--mes-accent-soft)', color: 'var(--mes-accent-dark)' }}><IconAlertTriangle size={17} /></div>
              <div><div className="mes-stat-value">{kpi.today}</div><div className="mes-stat-label">오늘 발생</div></div>
            </div>
            <div className="mes-stat-card alarm-kpi-card accent-warning">
              <div className="mes-stat-icon" style={{ background: 'var(--mes-warning-soft)', color: 'var(--mes-warning)' }}><IconAlertTriangle size={17} /></div>
              <div><div className="mes-stat-value">{kpi.unacked}</div><div className="mes-stat-label">미인지</div></div>
            </div>
            <div className="mes-stat-card alarm-kpi-card accent-success">
              <div className="mes-stat-icon" style={{ background: 'var(--mes-success-soft)', color: 'var(--mes-success)' }}><IconAlertTriangle size={17} /></div>
              <div><div className="mes-stat-value">{kpi.clearedToday}</div><div className="mes-stat-label">오늘 해제</div></div>
            </div>
          </div>

          <div className="alarm-top-row">
            <div className="mes-card alarm-dash-card">
              <div className="alarm-dash-card-title"><IconGauge size={14} /> 설비별 최다 발생 메시지 (최근 1개월)</div>
              <div className="alarm-dash-card-body">
                {topMsgByFolder.length === 0 && <div className="alarm-dash-empty">최근 1개월간 발생 이력이 없습니다.</div>}
                {topMsgByFolder.map((r, i) => (
                  <div className="alarm-msg-row" key={r.folderId}>
                    <span className="alarm-msg-rank">{i + 1}</span>
                    <div className="alarm-msg-body">
                      <div className="alarm-msg-plc">{r.folderLabel}</div>
                      <div className="alarm-msg-text" title={r.alarmMsg}>{r.alarmMsg}</div>
                    </div>
                    <span className="alarm-msg-count">{r.cnt}건</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mes-card alarm-chart-card">
              <div className="alarm-chart-header">
                <div>
                  <div className="alarm-chart-title"><IconChartAreaLine size={16} /> 시간별 알람 발생 추이</div>
                  <div className="alarm-chart-subtitle">최근 24시간 · 심각도별 누적</div>
                </div>
                <div className="alarm-chart-stat">
                  <div className="alarm-chart-stat-value">{totalTrendCount}</div>
                  <div className="alarm-chart-stat-label">총 발생 건수</div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={severityTrend} margin={{ top: 6, right: 12, left: -14, bottom: 0 }}>
                  <defs>
                    <linearGradient id="sevGrad1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={SEV_COLORS[1]} stopOpacity={0.38} />
                      <stop offset="95%" stopColor={SEV_COLORS[1]} stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="sevGrad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={SEV_COLORS[2]} stopOpacity={0.42} />
                      <stop offset="95%" stopColor={SEV_COLORS[2]} stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="sevGrad3" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={SEV_COLORS[3]} stopOpacity={0.48} />
                      <stop offset="95%" stopColor={SEV_COLORS[3]} stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--mes-line)" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={2} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <RTooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Area type="monotone" dataKey="level1" stackId="sev" name="Lv1" stroke={SEV_COLORS[1]} fill="url(#sevGrad1)" strokeWidth={2} />
                  <Area type="monotone" dataKey="level2" stackId="sev" name="Lv2" stroke={SEV_COLORS[2]} fill="url(#sevGrad2)" strokeWidth={2} />
                  <Area type="monotone" dataKey="level3" stackId="sev" name="Lv3" stroke={SEV_COLORS[3]} fill="url(#sevGrad3)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mes-card alarm-chart-card">
              <div className="alarm-chart-header">
                <div>
                  <div className="alarm-chart-title"><IconStopwatch size={16} /> 알람 응답 시간 추이</div>
                  <div className="alarm-chart-subtitle">최근 24시간 · 발생~해제 평균</div>
                </div>
                <div className="alarm-chart-stat">
                  <div className="alarm-chart-stat-value">{avgResponseOverall != null ? avgResponseOverall : '—'}<span className="alarm-chart-stat-unit">분</span></div>
                  <div className="alarm-chart-stat-label">평균 응답 시간</div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={responseTrend} margin={{ top: 20, right: 12, left: -14, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--mes-line)" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={2} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <RTooltip
                    cursor={{ fill: 'var(--mes-accent-soft)' }}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    formatter={(v, _name, item) => (v == null ? ['데이터 없음', '응답시간'] : [`${v}분 (${item.payload.count}건)`, '평균 응답'])}
                  />
                  <Bar dataKey="avgMinutes" fill="#805AD5" radius={[4, 4, 0, 0]} maxBarSize={26}>
                    <LabelList dataKey="avgMinutes" position="top" formatter={(v) => (v == null ? '' : `${v}`)} style={{ fontSize: 10, fill: 'var(--mes-text-sub)' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="alarm-bottom-row">
            <div className="mes-card alarm-recent-card alarm-bottom-panel">
              <div className="alarm-recent-header">
                <div className="alarm-dash-card-title" style={{ marginBottom: 0 }}>최근 알람 ({recentAlarms.length}건)</div>
                <div className="alarm-recent-controls">
                  <select className="mes-field-inline" value={recentFolderId} onChange={(e) => setRecentFolderId(e.target.value)}>
                    <option value="">전체 설비</option>
                    {folders.map((f) => <option key={f.folderId} value={f.folderId}>{f.folderName}</option>)}
                  </select>
                  <div className="alarm-recent-seg-group">
                    {RECENT_HOURS_OPTIONS.map((h) => (
                      <button
                        key={h}
                        className={`alarm-recent-seg${recentHours === h ? ' active' : ''}`}
                        onClick={() => setRecentHours(h)}
                      >
                        {h}시간
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="alarm-feed-compact">
                {recentAlarms.length === 0 && <div className="alarm-dash-empty">해당 조건의 알람이 없습니다.</div>}
                {recentAlarms.map((a) => (
                  <div
                    className={`alarm-feed-card${!a.clearTime ? ' alarm-feed-card-active' : ''}${freshIds.has(a.historyId) ? ' alarm-feed-card-fresh' : ''}`}
                    key={a.historyId}
                    style={{ borderLeftColor: levelColor(a.level) }}
                  >
                    <span className="alarm-feed-folder">{a.folderName}</span>
                    <span className="alarm-feed-time">
                      {fmtDt(a.occurTime)}{a.clearTime ? ` ~ ${String(a.clearTime).slice(11, 19)}` : ''}
                    </span>
                    <span className="alarm-feed-msg" title={a.alarmMsg}>{a.alarmMsg}</span>
                    {!a.clearTime && <span className="alarm-feed-active-dot" title="활성" />}
                  </div>
                ))}
              </div>
            </div>

            <div className="mes-card alarm-bottom-panel">
              <div className="alarm-recent-header">
                <div className="alarm-dash-card-title" style={{ marginBottom: 0 }}>
                  <IconBellRinging size={14} /> 현재 발생 중인 알람 ({displayActive.length})
                  <span className="alarm-live-indicator"><span className="alarm-live-dot" />LIVE</span>
                </div>
              </div>
              <div className="alarm-dash-card-body">
                {displayActive.length === 0 && <div className="alarm-dash-empty">현재 활성 알람이 없습니다.</div>}
                {displayActive.map((a) => (
                  <div
                    className={`alarm-live-row${exitingIds.has(a.historyId) ? ' alarm-live-row-exiting' : ''}${newIds.has(a.historyId) ? ' alarm-live-row-entering' : ''}`}
                    key={a.historyId}
                    style={{ borderLeftColor: levelColor(a.level) }}
                  >
                    <div className="alarm-live-body">
                      <div className="alarm-live-name">
                        {a.folderName} <span className="alarm-live-detail">· {a.tagName} · {a.alarmMsg}</span>
                      </div>
                    </div>
                    <span className="alarm-live-time">{timeAgo(a.occurTime)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16, flex: 1, minHeight: 0 }}>
          <div className="mes-card">
            <div className="mes-toolbar" style={{ marginBottom: 8 }}>
              <span className="mes-page-desc" style={{ fontWeight: 600 }}>폴더</span>
              <button className="mes-btn mes-btn-ghost" onClick={handleAddFolder}>
                <IconFolderPlus size={15} />
              </button>
            </div>
            <div>
              {folders.map((f) => (
                <div
                  key={f.folderId}
                  onClick={() => setSelectedFolder(f.folderId)}
                  style={{
                    padding: '8px 10px', borderRadius: 7, cursor: 'pointer', fontSize: 13,
                    background: selectedFolder === f.folderId ? 'var(--mes-accent-soft)' : 'transparent',
                    color: selectedFolder === f.folderId ? 'var(--mes-accent-dark)' : 'var(--mes-text)',
                    fontWeight: selectedFolder === f.folderId ? 600 : 400,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                >
                  <span>{f.folderName}</span>
                  <span
                    style={{ fontSize: 11, color: 'var(--mes-text-faint)' }}
                    onClick={(e) => { e.stopPropagation(); handleDeleteFolder(f.folderId, f.folderName); }}
                  >
                    ✕
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mes-card">
            <div className="mes-toolbar">
              <span className="mes-page-desc" style={{ fontWeight: 600 }}>
                태그 {selectedFolder ? `(${folders.find((f) => f.folderId === selectedFolder)?.folderName ?? ''})` : ''}
              </span>
              <button className="mes-btn mes-btn-primary" onClick={openCreateTag}>
                <IconPlus size={15} /> 태그 등록
              </button>
            </div>
            <DataTable data={tags} columns={tagColumns} height="420px" />
          </div>
        </div>
      )}

      {modalOpen && (
        <Modal title={editing ? '태그 수정' : '태그 등록'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmitTag}>
            <div className="mes-form-grid">
              <div className="mes-field">
                <label>태그 이름 *</label>
                <input value={form.tagName} onChange={(e) => setForm({ ...form, tagName: e.target.value })} />
              </div>
              <div className="mes-field">
                <label>PLC 주소 *</label>
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="예) M7000" />
              </div>
              <div className="mes-field">
                <label>PLC *</label>
                <select value={form.plcId} onChange={(e) => setForm({ ...form, plcId: e.target.value })}>
                  <option value="">선택</option>
                  {plcs.map((p) => (
                    <option key={p.plcId} value={p.plcId}>{p.label} ({p.plcId})</option>
                  ))}
                </select>
              </div>
              <div className="mes-field">
                <label>레벨</label>
                <select value={form.level} onChange={(e) => setForm({ ...form, level: Number(e.target.value) })}>
                  <option value={1}>1 (경고)</option>
                  <option value={2}>2 (주의)</option>
                  <option value={3}>3 (위험)</option>
                </select>
              </div>
              <div className="mes-field mes-field-full">
                <label>알람 메시지</label>
                <input value={form.alarmMsg} onChange={(e) => setForm({ ...form, alarmMsg: e.target.value })} />
              </div>
              <div className="mes-field">
                <label>사용 여부</label>
                <select value={form.enabled} onChange={(e) => setForm({ ...form, enabled: Number(e.target.value) })}>
                  <option value={1}>사용</option>
                  <option value={0}>중지</option>
                </select>
              </div>
            </div>
            {formError && <div className="mes-error" style={{ marginTop: 4 }}>{formError}</div>}
            <div className="mes-modal-footer">
              <button type="button" className="mes-btn mes-btn-secondary" onClick={() => setModalOpen(false)}>취소</button>
              <button type="submit" className="mes-btn mes-btn-primary" disabled={saving}>{saving ? '저장 중...' : '저장'}</button>
            </div>
          </form>
        </Modal>
      )}

      <Toast toast={toast} />
    </div>
  );
}
