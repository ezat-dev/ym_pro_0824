import { useMemo, useState } from 'react';

const R = 62;
const CIRC = 2 * Math.PI * R;
const GAP = 2.2; // 슬라이스 사이 틈(둘레 길이 단위)
const STROKE = 22;

// data(dataKey/value/color) → 각 조각의 SVG stroke-dasharray/offset을 미리 계산해 둔다.
function computeSegments(data) {
  const total = data.reduce((s, d) => s + d.value, 0);
  let acc = 0;
  return data.map((d) => {
    const frac = total ? d.value / total : 0;
    const dash = Math.max(frac * CIRC - GAP, 0);
    const seg = {
      ...d,
      dash,
      gapLen: CIRC - dash,
      offset: -acc,
      pct: total ? Math.round((d.value / total) * 100) : 0,
    };
    acc += frac * CIRC;
    return seg;
  });
}

// 같은 링을 그림자색으로 살짝 아래로 겹쳐 그려 옆면 두께가 있는 것처럼 보이게 하는 도넛.
// 회전이나 원근 계산 없이 SVG 두 장만으로 입체감을 낸다 — WebGL/애니메이션 루프에 기대지
// 않아서 렌더링이 항상 보장된다.
export default function DonutExtruded({ data, height = 190 }) {
  const [hoverKey, setHoverKey] = useState(null);
  const segments = useMemo(() => computeSegments(data), [data]);
  const hovered = segments.find((s) => s.key === hoverKey);

  return (
    <div className="donut-extrude-wrap" style={{ height }}>
      <svg className="donut-extrude-layer donut-extrude-shadow" viewBox="0 0 160 160">
        <g transform="rotate(-90 80 80)">
          {segments.map((s) => (
            <circle
              key={s.key} cx="80" cy="80" r={R} fill="none" stroke={s.color} strokeWidth={STROKE}
              strokeDasharray={`${s.dash} ${s.gapLen}`} strokeDashoffset={s.offset} strokeLinecap="round"
            />
          ))}
        </g>
      </svg>
      <svg className="donut-extrude-layer donut-extrude-top" viewBox="0 0 160 160">
        <g transform="rotate(-90 80 80)">
          {segments.map((s) => (
            <circle
              key={s.key} cx="80" cy="80" r={R} fill="none" stroke={s.color}
              strokeWidth={hoverKey === s.key ? STROKE + 3 : STROKE}
              strokeDasharray={`${s.dash} ${s.gapLen}`} strokeDashoffset={s.offset} strokeLinecap="round"
              opacity={hoverKey && hoverKey !== s.key ? 0.55 : 1}
              className="donut-extrude-seg"
              onMouseEnter={() => setHoverKey(s.key)}
              onMouseLeave={() => setHoverKey(null)}
            />
          ))}
        </g>
      </svg>
      {hovered && (
        <div className="rank2-donut-tooltip donut-extrude-tooltip">
          <div className="rank2-donut-tooltip-title">{hovered.label}</div>
          <div className="rank2-donut-tooltip-value">{hovered.value}건 · {hovered.pct}%</div>
        </div>
      )}
    </div>
  );
}
