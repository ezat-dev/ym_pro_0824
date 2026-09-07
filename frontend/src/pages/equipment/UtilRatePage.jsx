import { useMemo, useState } from 'react';
import {
  IconGauge, IconTrophy, IconAlertTriangle, IconTarget, IconClockHour4,
  IconChartBar, IconChartAreaLine, IconChartPie, IconLock,
} from '@tabler/icons-react';
import {
  ResponsiveContainer, BarChart, Bar, Cell, LabelList, XAxis, YAxis,
  CartesianGrid, Tooltip as RTooltip, AreaChart, Area, ReferenceLine,
  RadialBarChart, RadialBar, PolarAngleAxis, PieChart, Pie,
} from 'recharts';
import { usePermission } from '../../hooks/usePermission';
import './UtilRatePage.css';

// ⚠️ UI 목업 — 실제 API/DB 연동 전 단계. 아래 데이터는 화면 구성 확인용 더미값이다.
// 설비 코드는 이 앱의 TREND/조절계 관리 화면에서 실제로 쓰는 BCF1~BCF6 명명을 그대로 따른다.

const TARGET_RATE = 85;

const SUCCESS = '#1f9d63';
const WARNING = '#b7791f';
const DANGER = '#d9483f';
const TRACK = '#eef0f4';

const EQUIP_COLORS = { BCF1: '#5b7fc7', BCF2: '#1f9d63', BCF3: '#f5a623', BCF4: '#e0483f', BCF5: '#805AD5', BCF6: '#0891b2' };

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const MOCK_EQUIP = [
  { code: 'BCF1', name: '연속열처리로 1호기', rate: 94.2, runHours: 22.6, stopPlan: 0.8, stopFail: 0.6 },
  { code: 'BCF2', name: '연속열처리로 2호기', rate: 88.5, runHours: 21.2, stopPlan: 1.5, stopFail: 1.3 },
  { code: 'BCF3', name: '연속열처리로 3호기', rate: 91.7, runHours: 22.0, stopPlan: 1.2, stopFail: 0.8 },
  { code: 'BCF4', name: '연속열처리로 4호기', rate: 76.3, runHours: 18.3, stopPlan: 2.4, stopFail: 3.3 },
  { code: 'BCF5', name: '연속열처리로 5호기', rate: 96.8, runHours: 23.2, stopPlan: 0.5, stopFail: 0.3 },
  { code: 'BCF6', name: '연속열처리로 6호기', rate: 82.1, runHours: 19.7, stopPlan: 2.1, stopFail: 2.2 },
];

const TREND_DATA = [
  { day: '8/26', rate: 85.1 },
  { day: '8/27', rate: 87.4 },
  { day: '8/28', rate: 83.9 },
  { day: '8/29', rate: 89.6 },
  { day: '8/30', rate: 91.2 },
  { day: '8/31', rate: 86.8 },
  { day: '9/1', rate: 88.3 },
];

function healthColor(rate) {
  if (rate >= 90) return SUCCESS;
  if (rate >= 75) return WARNING;
  return DANGER;
}
function healthLabel(rate) {
  if (rate >= 90) return '우수';
  if (rate >= 75) return '주의';
  return '경고';
}
function healthGradient(rate) {
  if (rate >= 90) return ['#4ade80', '#0d9165'];
  if (rate >= 75) return ['#fbbf55', '#a5670f'];
  return ['#f88a80', '#a5271e'];
}

// 단일 값(가동률)을 예쁜 그라디언트 원형 게이지로 그린다 — recharts의 RadialBarChart를 그대로
// 활용해 매끈한 호(arc)와 둥근 캡을 얻고, 중앙 %는 부모가 절대위치 오버레이로 얹는다.
// "실시간" 느낌은 배경 글로우나 링 위에 얹는 점 대신, 호를 채우는 그라디언트 자체를
// SVG <animateTransform>으로 아주 천천히 회전시켜서 낸다 — 새 요소 없이, 이미 있는 색이
// 링 안에서 은은하게 흐르듯 움직이는 정도라 화면이 산만해지지 않는다.
function RadialGauge({ value, gradId, from, to, thickness = 14, track = TRACK, spin = 6 }) {
  return (
    <div className="ur-gauge-chart-layer">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="74%"
          outerRadius="100%"
          barSize={thickness}
          data={[{ value }]}
          startAngle={90}
          endAngle={-270}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={from} />
              <stop offset="100%" stopColor={to} />
              {!REDUCED_MOTION && (
                <animateTransform
                  attributeName="gradientTransform"
                  type="rotate"
                  from="0 0.5 0.5"
                  to="360 0.5 0.5"
                  dur={`${spin}s`}
                  repeatCount="indefinite"
                />
              )}
            </linearGradient>
          </defs>
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} axisLine={false} />
          <RadialBar
            dataKey="value"
            cornerRadius={thickness / 2}
            fill={`url(#${gradId})`}
            background={{ fill: track }}
            animationDuration={1200}
            animationEasing="ease-out"
          />
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  );
}

function GaugeTip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="ur-chart-tooltip">
      <div className="ur-chart-tooltip-title">{p.name}</div>
      <div className="ur-chart-tooltip-value" style={{ color: healthColor(p.rate) }}>{p.rate.toFixed(1)}%</div>
    </div>
  );
}

function TrendTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="ur-chart-tooltip">
      <div className="ur-chart-tooltip-title">{label}</div>
      <div className="ur-chart-tooltip-value">{payload[0].value.toFixed(1)}%</div>
    </div>
  );
}

function BreakdownTip({ active, payload, total }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="ur-chart-tooltip">
      <div className="ur-chart-tooltip-title">{p.label}</div>
      <div className="ur-chart-tooltip-value" style={{ color: p.color }}>
        {p.value.toFixed(1)}h · {total ? Math.round((p.value / total) * 100) : 0}%
      </div>
    </div>
  );
}

export default function UtilRatePage() {
  const permission = usePermission('/equipment/utilRate');
  const [hoverCode, setHoverCode] = useState(null);

  const avgRate = useMemo(() => MOCK_EQUIP.reduce((s, e) => s + e.rate, 0) / MOCK_EQUIP.length, []);
  const best = useMemo(() => [...MOCK_EQUIP].sort((a, b) => b.rate - a.rate)[0], []);
  const worst = useMemo(() => [...MOCK_EQUIP].sort((a, b) => a.rate - b.rate)[0], []);
  const achievedCount = MOCK_EQUIP.filter((e) => e.rate >= TARGET_RATE).length;
  const totalRunHours = useMemo(() => MOCK_EQUIP.reduce((s, e) => s + e.runHours, 0), []);

  const rankedEquip = useMemo(() => [...MOCK_EQUIP].sort((a, b) => b.rate - a.rate), []);

  const breakdownDonut = useMemo(() => {
    const run = MOCK_EQUIP.reduce((s, e) => s + e.runHours, 0);
    const plan = MOCK_EQUIP.reduce((s, e) => s + e.stopPlan, 0);
    const fail = MOCK_EQUIP.reduce((s, e) => s + e.stopFail, 0);
    return [
      { key: 'run', label: '가동', value: Number(run.toFixed(1)), color: SUCCESS, from: '#4ade80', to: '#0d9165' },
      { key: 'plan', label: '계획정지', value: Number(plan.toFixed(1)), color: WARNING, from: '#fbbf55', to: '#a5670f' },
      { key: 'fail', label: '고장정지', value: Number(fail.toFixed(1)), color: DANGER, from: '#f88a80', to: '#a5271e' },
    ];
  }, []);
  const breakdownTotal = breakdownDonut.reduce((s, d) => s + d.value, 0);

  if (!permission.loading && !permission.canRead) {
    return (
      <div className="mes-page">
        <div className="mes-card" style={{ padding: 32, textAlign: 'center', color: 'var(--mes-text-faint)' }}>
          <IconLock size={20} style={{ marginBottom: 8 }} />
          <div>이 화면에 대한 조회 권한이 없습니다.</div>
        </div>
      </div>
    );
  }

  const [heroFrom, heroTo] = ['#7dabff', '#3730a3'];

  return (
    <div className="mes-page ur-page mes-page-fill">
      <div className="mes-page-header">
        <div className="mes-page-heading">
          <div className="mes-page-icon ur-page-icon">
            <IconGauge size={20} />
          </div>
          <div>
            <h2 className="mes-page-title">설비가동률분석</h2>
            <p className="mes-page-desc">설비별 가동률·가동시간을 한눈에 비교합니다. (UI 목업 — 실데이터 연동 전)</p>
          </div>
        </div>
        <span className="ur-mock-badge">MOCK DATA</span>
      </div>

      <div className="ur-scroll">
        {/* ── 히어로: 전체 평균 가동률 + KPI 스탯 ── */}
        <div className="ur-hero-row">
          <div className="mes-card ur-hero-donut-card">
            <div className="ur-hero-donut-wrap">
              <RadialGauge value={avgRate} gradId="urHeroGrad" from={heroFrom} to={heroTo} thickness={20} spin={8} />
              <div className="ur-hero-donut-center">
                <div className="ur-hero-donut-value" style={{ color: heroTo }}>{avgRate.toFixed(1)}<span>%</span></div>
                <div className="ur-hero-donut-label">전체 평균 가동률</div>
              </div>
            </div>
            <div className="ur-hero-target">
              목표 {TARGET_RATE}% · <b style={{ color: avgRate >= TARGET_RATE ? SUCCESS : DANGER }}>
                {avgRate >= TARGET_RATE ? `+${(avgRate - TARGET_RATE).toFixed(1)}%p 초과` : `${(avgRate - TARGET_RATE).toFixed(1)}%p 미달`}
              </b>
            </div>
          </div>

          <div className="ur-kpi-grid">
            <div className="mes-card ur-kpi-card">
              <div className="ur-kpi-icon ur-kpi-icon-gold"><IconTrophy size={18} /></div>
              <div className="ur-kpi-body">
                <span className="ur-kpi-label">최고 가동 설비</span>
                <span className="ur-kpi-value">{best.code} <em>{best.rate.toFixed(1)}%</em></span>
              </div>
            </div>
            <div className="mes-card ur-kpi-card">
              <div className="ur-kpi-icon ur-kpi-icon-danger"><IconAlertTriangle size={18} /></div>
              <div className="ur-kpi-body">
                <span className="ur-kpi-label">최저 가동 설비</span>
                <span className="ur-kpi-value">{worst.code} <em>{worst.rate.toFixed(1)}%</em></span>
              </div>
            </div>
            <div className="mes-card ur-kpi-card">
              <div className="ur-kpi-icon ur-kpi-icon-accent"><IconTarget size={18} /></div>
              <div className="ur-kpi-body">
                <span className="ur-kpi-label">목표 달성 설비</span>
                <span className="ur-kpi-value">{achievedCount} <em>/ {MOCK_EQUIP.length}대</em></span>
              </div>
            </div>
            <div className="mes-card ur-kpi-card">
              <div className="ur-kpi-icon ur-kpi-icon-purple"><IconClockHour4 size={18} /></div>
              <div className="ur-kpi-body">
                <span className="ur-kpi-label">총 가동시간(24h)</span>
                <span className="ur-kpi-value">{totalRunHours.toFixed(1)} <em>시간</em></span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 랭킹 막대그래프 + 가동/정지 비율 도넛 ── */}
        <div className="ur-bottom-row">
          <div className="mes-card ur-rank-card">
            <div className="ur-section-title"><IconChartBar size={15} /> 설비별 가동률 순위</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={rankedEquip}
                layout="vertical"
                margin={{ top: 4, right: 36, left: 6, bottom: 4 }}
                onMouseMove={(s) => setHoverCode(s?.activePayload?.[0]?.payload?.code ?? null)}
                onMouseLeave={() => setHoverCode(null)}
              >
                <defs>
                  {rankedEquip.map((e) => {
                    const [gFrom, gTo] = healthGradient(e.rate);
                    return (
                      <linearGradient key={e.code} id={`urBarGrad-${e.code}`} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={gFrom} />
                        <stop offset="100%" stopColor={gTo} />
                      </linearGradient>
                    );
                  })}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--mes-line)" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--mes-text-faint)' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="code" width={44} tick={{ fontSize: 12, fontWeight: 700, fill: 'var(--mes-text)' }} axisLine={false} tickLine={false} />
                <RTooltip content={<GaugeTip />} cursor={{ fill: 'var(--mes-accent-soft)' }} />
                <ReferenceLine x={TARGET_RATE} stroke="var(--mes-text-faint)" strokeDasharray="4 4" />
                <Bar dataKey="rate" radius={[0, 8, 8, 0]} maxBarSize={26} name="가동률">
                  {rankedEquip.map((e) => (
                    <Cell key={e.code} fill={`url(#urBarGrad-${e.code})`} opacity={hoverCode && hoverCode !== e.code ? 0.45 : 1} />
                  ))}
                  <LabelList dataKey="rate" position="right" formatter={(v) => `${v.toFixed(1)}%`} style={{ fontSize: 11, fontWeight: 700, fill: 'var(--mes-text)' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="ur-rank-legend">
              <span><i style={{ background: SUCCESS }} />90% 이상</span>
              <span><i style={{ background: WARNING }} />75~90%</span>
              <span><i style={{ background: DANGER }} />75% 미만</span>
              <span className="ur-rank-legend-target">┊ 목표 {TARGET_RATE}%</span>
            </div>
          </div>

          <div className="mes-card ur-breakdown-card">
            <div className="ur-section-title"><IconChartPie size={15} /> 전체 시간 구성비 (24h × 6대)</div>
            <div className="ur-breakdown-body">
              <div className="ur-breakdown-donut-wrap">
                <div className="ur-gauge-chart-layer">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      {breakdownDonut.map((d, i) => (
                        <linearGradient key={d.key} id={`urPieGrad-${d.key}`} x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor={d.from} />
                          <stop offset="100%" stopColor={d.to} />
                          {!REDUCED_MOTION && (
                            <animateTransform
                              attributeName="gradientTransform"
                              type="rotate"
                              from="0 0.5 0.5"
                              to="360 0.5 0.5"
                              dur={`${6 + i * 0.6}s`}
                              repeatCount="indefinite"
                            />
                          )}
                        </linearGradient>
                      ))}
                    </defs>
                    <Pie
                      data={breakdownDonut}
                      dataKey="value"
                      nameKey="label"
                      innerRadius="64%"
                      outerRadius="98%"
                      paddingAngle={4}
                      cornerRadius={7}
                      startAngle={90}
                      endAngle={-270}
                      stroke="none"
                      animationDuration={1200}
                      animationEasing="ease-out"
                    >
                      {breakdownDonut.map((d) => <Cell key={d.key} fill={`url(#urPieGrad-${d.key})`} />)}
                    </Pie>
                    <RTooltip content={<BreakdownTip total={breakdownTotal} />} />
                  </PieChart>
                </ResponsiveContainer>
                </div>
                <div className="ur-breakdown-donut-center">
                  <div className="ur-breakdown-donut-value">{breakdownTotal.toFixed(0)}</div>
                  <div className="ur-breakdown-donut-label">시간</div>
                </div>
              </div>
              <div className="ur-breakdown-legend">
                {breakdownDonut.map((d) => (
                  <div className="ur-breakdown-legend-item" key={d.key}>
                    <span className="ur-breakdown-dot" style={{ background: `linear-gradient(135deg, ${d.from}, ${d.to})` }} />
                    <div className="ur-breakdown-legend-text">
                      <span className="ur-breakdown-label">{d.label}</span>
                      <span className="ur-breakdown-meta">
                        {d.value.toFixed(1)}h · <b>{breakdownTotal ? Math.round((d.value / breakdownTotal) * 100) : 0}%</b>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── 최근 7일 추이 ── */}
        <div className="mes-card ur-trend-card">
          <div className="ur-section-title"><IconChartAreaLine size={15} /> 최근 7일 평균 가동률 추이</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={TREND_DATA} margin={{ top: 16, right: 20, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="urTrendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--mes-accent)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--mes-accent)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--mes-line)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--mes-text-faint)' }} axisLine={false} tickLine={false} />
              <YAxis domain={[70, 100]} tick={{ fontSize: 11, fill: 'var(--mes-text-faint)' }} axisLine={false} tickLine={false} width={38} />
              <RTooltip content={<TrendTip />} />
              <ReferenceLine y={TARGET_RATE} stroke={SUCCESS} strokeDasharray="4 4" label={{ value: `목표 ${TARGET_RATE}%`, position: 'insideTopLeft', fontSize: 10, fill: SUCCESS, fontWeight: 700 }} />
              <Area type="monotone" dataKey="rate" stroke="var(--mes-accent)" strokeWidth={2.5} fill="url(#urTrendFill)" dot={{ r: 3, fill: 'var(--mes-accent)', strokeWidth: 0 }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ── 설비별 게이지 카드 6개 ── */}
        <div className="ur-section-title"><IconChartPie size={15} /> 설비별 가동률</div>
        <div className="ur-gauge-grid">
          {MOCK_EQUIP.map((e, i) => {
            const color = healthColor(e.rate);
            const [gFrom, gTo] = healthGradient(e.rate);
            return (
              <div className="mes-card ur-gauge-card" key={e.code} style={{ '--ur-accent': EQUIP_COLORS[e.code] }}>
                <div className="ur-gauge-card-head">
                  <span className="ur-gauge-code" style={{ background: EQUIP_COLORS[e.code] }}>{e.code}</span>
                  <span className="ur-gauge-name">{e.name}</span>
                  <span className={`ur-health-badge ur-health-${e.rate >= 90 ? 'good' : e.rate >= 75 ? 'warn' : 'bad'}`}>
                    {healthLabel(e.rate)}
                  </span>
                </div>
                <div className="ur-gauge-donut-wrap">
                  <RadialGauge value={e.rate} gradId={`urGaugeGrad-${e.code}`} from={gFrom} to={gTo} thickness={14} spin={5.5 + (i % 4) * 0.5} />
                  <div className="ur-gauge-donut-center">
                    <div className="ur-gauge-donut-value" style={{ color }}>{e.rate.toFixed(1)}</div>
                    <div className="ur-gauge-donut-pct">%</div>
                  </div>
                </div>
                <div className="ur-gauge-foot">
                  <div className="ur-gauge-foot-item">
                    <span className="ur-gauge-foot-dot" style={{ background: SUCCESS }} />
                    가동 <b>{e.runHours.toFixed(1)}h</b>
                  </div>
                  <div className="ur-gauge-foot-item">
                    <span className="ur-gauge-foot-dot" style={{ background: WARNING }} />
                    정지 <b>{(e.stopPlan + e.stopFail).toFixed(1)}h</b>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
