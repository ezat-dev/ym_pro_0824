import {
  IconBuildingFactory2, IconCpu, IconDeviceDesktop, IconDatabase, IconWorld, IconUsers,
} from '@tabler/icons-react';

// 로그인 좌측 브랜드 패널 장식 — 순전히 분위기용 애니메이션, 실제 데이터 흐름과는 무관하다.
// 설비 → PLC → PC → DB → WEB → 사용자 6단계가 2열 지그재그(뱀 모양)로 배치되고, 빛나는
// 혜성이 각 구간을 순서대로 흘러가며 정확히 도착하는 순간 노드에 링이 퍼진다.
// (v0로 뽑은 참고 컴포넌트의 SVG/SMIL 애니메이션 로직을 이 프로젝트의 일반 JS/CSS로 포팅)

const VB_W = 680;
const VB_H = 430;
const NODE_W = 250;
const NODE_H = 88;

const COL_X = [34, 396];
const ROW_Y = [64, 215, 366];

// 뱀모양 순서 — 흐름 선이 스스로 겹치지 않도록
//   설비 → PLC        (0행, 좌→우)
//            ↓
//   DB  ←  PC         (1행, 우→좌)
//   ↓
//   WEB → 사용자      (2행, 좌→우)
const POS = [[0, 0], [1, 0], [1, 1], [0, 1], [0, 2], [1, 2]];

function box(i) {
  const [col, row] = POS[i];
  const x = COL_X[col];
  const cy = ROW_Y[row];
  return { x, y: cy - NODE_H / 2, cx: x + NODE_W / 2, cy };
}

// 노드 i와 i+1 사이의 직선 구간(항상 축에 나란함)
function segment(i) {
  const a = box(i);
  const b = box(i + 1);
  if (a.cy === b.cy) {
    const dir = b.cx > a.cx ? 1 : -1;
    return { x1: a.cx + (dir * NODE_W) / 2, y1: a.cy, x2: b.cx - (dir * NODE_W) / 2, y2: b.cy, horizontal: true };
  }
  const dir = b.cy > a.cy ? 1 : -1;
  return { x1: a.cx, y1: a.cy + (dir * NODE_H) / 2, x2: b.cx, y2: b.cy - (dir * NODE_H) / 2, horizontal: false };
}

// 전체 애니메이션이 하나의 주기를 공유해서 서로 어긋나지 않게 한다.
const CYCLE = 8.4;
const SEG_START = 1.5;
const SEG_DUR = 1.15;

function slice(i) {
  return { start: (i * SEG_START) / CYCLE, end: (i * SEG_START + SEG_DUR) / CYCLE };
}

const f = (n) => Number(n.toFixed(4));

const NODES = [
  { title: '설비', desc: '센서 · 신호', tag: 'FIELD', Icon: IconBuildingFactory2 },
  { title: 'PLC', desc: '제어 로직 · 신호 변환', tag: 'OPC-UA', Icon: IconCpu },
  { title: 'PC', desc: '현장 수집 게이트웨이', tag: 'AGENT', Icon: IconDeviceDesktop },
  { title: 'DB', desc: '실시간 적재 · 이력 보관', tag: 'SQL', Icon: IconDatabase },
  { title: 'WEB', desc: '대시보드 · API 서비스', tag: 'HTTPS', Icon: IconWorld },
  { title: '사용자', desc: '모니터링 · 의사결정', tag: 'LIVE', Icon: IconUsers },
];

const EDGE_LABELS = ['신호', '수집', '적재', '조회', '표시'];
const SEG_COUNT = NODES.length - 1;

// 결정적(고정 시드) 별빛 위치 — 리렌더될 때마다 흩어진 위치가 안 바뀌게.
const STARS = (() => {
  let seed = 20260101;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  return Array.from({ length: 34 }, () => ({
    x: f(10 + rand() * (VB_W - 20)),
    y: f(10 + rand() * (VB_H - 20)),
    r: f(0.45 + rand() * 0.9),
    o: f(0.08 + rand() * 0.16),
    dur: f(4 + rand() * 5),
  }));
})();

/** 한 구간을 흘러가는 빛의 궤적 — 머리 + 진행 방향으로 옅어지는 혜성 꼬리 */
function Comet({ index }) {
  const s = segment(index);
  const path = `M ${s.x1} ${s.y1} L ${s.x2} ${s.y2}`;
  const { start, end } = slice(index);

  const motionKeyTimes = start === 0 ? `0;${f(end)};1` : `0;${f(start)};${f(end)};1`;
  const motionKeyPoints = start === 0 ? '0;1;1' : '0;0;1;1';

  const fadeIn = f(Math.max(start + 0.008, 0.008));
  const fadeOut = f(end - 0.022);
  const opacityKeyTimes = start === 0
    ? `0;${fadeOut};${f(end)};1`
    : `0;${f(start)};${fadeIn};${fadeOut};${f(end)};1`;
  const opacityValues = start === 0 ? '1;1;0;0' : '0;0;1;1;0;0';

  return (
    <g opacity="0">
      <animate attributeName="opacity" values={opacityValues} keyTimes={opacityKeyTimes} dur={`${CYCLE}s`} calcMode="linear" repeatCount="indefinite" />
      <animateMotion path={path} rotate="auto" dur={`${CYCLE}s`} calcMode="linear" keyPoints={motionKeyPoints} keyTimes={motionKeyTimes} repeatCount="indefinite" />
      <g filter="url(#loginCometGlow)">
        <path d="M 0 0 C -7 4.4 -18 3 -34 0.5 L -34 -0.5 C -18 -3 -7 -4.4 0 0 Z" fill="url(#loginCometTail)" />
        <circle r="6.5" fill="var(--login-flow)" opacity="0.28" />
        <circle r="2.6" fill="#fff" />
      </g>
    </g>
  );
}

/** 혜성이 노드에 도착하는 정확한 순간 스냅 열리듯 퍼지는 링 */
function ArrivalRipple({ nodeIndex }) {
  const b = box(nodeIndex);
  const at = nodeIndex === 0 ? 0 : slice(nodeIndex - 1).end; // 0번 노드는 매 주기 시작점
  const until = f(at + 0.105);
  const grow = 26;

  const keyTimes = at === 0 ? `0;${until};1` : `0;${f(at)};${until};1`;
  const hold = (from, to) => (at === 0 ? `${from};${to};${to}` : `${from};${from};${to};${to}`);

  const opacityKeyTimes = at === 0 ? `0;${until};1` : `0;${f(at - 0.0015)};${f(at)};${until};1`;
  const opacityValues = at === 0 ? '0.68;0;0' : '0;0;0.68;0;0';

  return (
    <rect x={b.x} y={b.y} width={NODE_W} height={NODE_H} rx="16" fill="none" stroke="var(--login-flow)" strokeWidth="1.25" opacity="0">
      <animate attributeName="opacity" values={opacityValues} keyTimes={opacityKeyTimes} dur={`${CYCLE}s`} calcMode="linear" repeatCount="indefinite" />
      <animate attributeName="x" values={hold(b.x, b.x - grow)} keyTimes={keyTimes} dur={`${CYCLE}s`} calcMode="linear" repeatCount="indefinite" />
      <animate attributeName="y" values={hold(b.y, b.y - grow)} keyTimes={keyTimes} dur={`${CYCLE}s`} calcMode="linear" repeatCount="indefinite" />
      <animate attributeName="width" values={hold(NODE_W, NODE_W + grow * 2)} keyTimes={keyTimes} dur={`${CYCLE}s`} calcMode="linear" repeatCount="indefinite" />
      <animate attributeName="height" values={hold(NODE_H, NODE_H + grow * 2)} keyTimes={keyTimes} dur={`${CYCLE}s`} calcMode="linear" repeatCount="indefinite" />
      <animate attributeName="rx" values={hold(16, 30)} keyTimes={keyTimes} dur={`${CYCLE}s`} calcMode="linear" repeatCount="indefinite" />
    </rect>
  );
}

export default function LoginNetworkDiagram() {
  return (
    <div className="login-net">
      {/* 1층 — 별빛, 연결선, 혜성.
          preserveAspectRatio="none": .login-net 박스가 (flex+aspect-ratio+max-height가 겹치면서)
          680:430 비율을 못 지킬 때가 있는데, 기본값(xMidYMid meet)은 그 오차만큼 SVG를 레터박스로
          가운데 정렬해버려서 percentage로 배치한 HTML 노드들과 어긋나 보인다. none으로 SVG 좌표계를
          박스 실제 크기에 그대로 늘려 맞추면 두 좌표계가 항상 일치한다(약간의 비율 왜곡은 감수). */}
      <svg aria-hidden="true" className="login-net-svg" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="loginCometTail" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="-34" y2="0">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.95" />
            <stop offset="28%" stopColor="var(--login-flow)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--login-flow)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="loginWireV" gradientUnits="objectBoundingBox" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--login-flow)" stopOpacity="0.05" />
            <stop offset="50%" stopColor="var(--login-flow)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="var(--login-flow)" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="loginWireH" gradientUnits="objectBoundingBox" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--login-flow)" stopOpacity="0.05" />
            <stop offset="50%" stopColor="var(--login-flow)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="var(--login-flow)" stopOpacity="0.05" />
          </linearGradient>
          <filter id="loginCometGlow" x="-200%" y="-400%" width="500%" height="900%">
            <feGaussianBlur stdDeviation="1.6" result="soft" />
            <feMerge>
              <feMergeNode in="soft" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g>
          {STARS.map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="var(--login-flow)" opacity={s.o}>
              <animate attributeName="opacity" values={`${s.o};${f(s.o * 2.8)};${s.o}`} dur={`${s.dur}s`} calcMode="linear" repeatCount="indefinite" />
            </circle>
          ))}
        </g>

        {Array.from({ length: SEG_COUNT }, (_, i) => {
          const s = segment(i);
          return (
            <g key={i} className="login-net-fade-in" style={{ animationDelay: `${0.14 * i + 0.1}s` }}>
              <line x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={s.horizontal ? 'url(#loginWireH)' : 'url(#loginWireV)'} strokeWidth="1.25" />
              {/* 선을 타고 은은하게 흐르는 점선 반짝임 */}
              <line x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="var(--login-flow)" strokeWidth="1.25" strokeLinecap="round" strokeDasharray="1.5 9" opacity="0.32">
                <animate attributeName="stroke-dashoffset" values="10.5;0" dur="2.6s" calcMode="linear" repeatCount="indefinite" />
              </line>
              <circle cx={s.x1} cy={s.y1} r="1.8" fill="var(--login-flow)" opacity="0.5" />
              <circle cx={s.x2} cy={s.y2} r="1.8" fill="var(--login-flow)" opacity="0.5" />
            </g>
          );
        })}

        <g className="login-net-fade-in" style={{ animationDelay: '0.95s' }}>
          {Array.from({ length: SEG_COUNT }, (_, i) => <Comet key={i} index={i} />)}
        </g>
      </svg>

      {/* 2층 — 유리질 노드 */}
      {NODES.map((node, i) => {
        const b = box(i);
        const StopIcon = node.Icon;
        return (
          <div
            key={node.title}
            className="login-net-node-in"
            style={{
              left: `${(b.x / VB_W) * 100}%`,
              top: `${(b.y / VB_H) * 100}%`,
              width: `${(NODE_W / VB_W) * 100}%`,
              height: `${(NODE_H / VB_H) * 100}%`,
              animationDelay: `${0.14 * i}s`,
            }}
          >
            <div className="login-net-glass">
              <div className="login-net-glass-highlight" />
              <div className="login-net-glass-shade" />
              <div className="login-net-glass-content">
                <span className="login-net-glass-icon"><StopIcon size={16} stroke={1.75} /></span>
                <div className="login-net-glass-text">
                  <div className="login-net-glass-titlerow">
                    <span className="login-net-glass-title">{node.title}</span>
                    <span className="login-net-glass-tag">{node.tag}</span>
                  </div>
                  <p className="login-net-glass-desc">{node.desc}</p>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* 구간 라벨 — 가로 구간은 선 위쪽, 세로 구간은 옆쪽 */}
      {EDGE_LABELS.map((label, i) => {
        const s = segment(i);
        const mx = (s.x1 + s.x2) / 2;
        const my = (s.y1 + s.y2) / 2;
        return (
          <span
            key={label}
            className="login-net-edge-label login-net-fade-in"
            style={{
              left: `${(mx / VB_W) * 100}%`,
              top: `${((my + (s.horizontal ? -13 : 0)) / VB_H) * 100}%`,
              marginLeft: s.horizontal ? 0 : `${(22 / VB_W) * 100}%`,
              animationDelay: `${0.14 * i + 0.35}s`,
            }}
          >
            {label}
          </span>
        );
      })}

      {/* 3층 — 도착 링(유리 노드 위에 겹쳐서 빛처럼 보이게) */}
      <svg aria-hidden="true" className="login-net-svg login-net-ripple-layer login-net-fade-in" style={{ animationDelay: '0.95s' }} viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="none">
        {NODES.map((node, i) => <ArrivalRipple key={node.title} nodeIndex={i} />)}
      </svg>
    </div>
  );
}
