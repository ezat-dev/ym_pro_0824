// TREND 차트 값 보정 / 색상 규칙 — sample_pro main_1/monitor/trend.jsp 이식.
// 원본은 이 로직이 buildKpiCards/buildMainChart/ExcelExportService 3곳에 중복돼 있었는데
// 여기서는 하나로 모았다.
//
// 이중보정 방지: tb_temp_tag.scale이 설정된 태그(예: BCF1 계열 — "+50"/"-100"/"*0.01"/"/2")는
// C# TempMonitorService가 tb_temp_snapshot에 적재하는 시점에 이미 그 보정을 적용해 저장한다
// (schema 주석: "스냅샷 저장 전 원시값에 적용할 보정식"). trend.jsp의 BCF별 하드코딩 보정
// (아래 규칙들)은 scale 컬럼이 없던 시절/없는 태그(BCF6~12 일부)를 위한 별도 경로였고,
// 실제로 BCF1 태그는 이 하드코딩 규칙 어디에도 안 걸린다 — 즉 원래도 "같은 태그에 두 메커니즘이
// 같이 걸리는" 설계가 아니었다. scale이 설정된 태그에 아래 하드코딩 규칙까지 적용하면 이미
// 보정된 값을 또 보정하게 되므로, scale이 있으면 원시값을 그대로 쓰고 하드코딩 규칙은 건너뛴다.

export const EQUT_MAP = {
  BCF1: '2420M001', BCF2: '2420M002', BCF3: '2420M003',
  BCF4: '2420M004', BCF5: '2420M005', BCF6: '2420M011',
  BCF7: '2420M006', BCF8: '2420M007', BCF9: '2420M008',
  BCF10: '2420M009', BCF11: '2420M010', BCF12: '2421M002',
};

export const COLORS = [
  '#60A5FA', '#F87171', '#4ADE80', '#FBBF24',
  '#A78BFA', '#22D3EE', '#F472B6', '#FDE047',
  '#93C5FD', '#86EFAC', '#C084FC', '#2DD4BF',
];

const TYPE_PALETTES = {
  ct_pv: ['#FF1744'],
  uj_pv: ['#4ADE80', '#22C55E', '#86EFAC', '#16A34A', '#BBF7D0'],
  ct_c3h8: ['#A855F7', '#9333EA', '#C084FC', '#7C3AED'],
  c3h8: ['#F472B6', '#EC4899', '#FBCFE8', '#DB2777'],
  cp_pv: ['#22D3EE', '#06B6D4', '#67E8F9', '#0891B2'],
};

function nameOf(t) {
  return (t.trendName || t.tagName || t.colName || '').toLowerCase();
}

export function getEquipFromTag(t) {
  if (t.equipId) return t.equipId;
  const name = (t.tagName || '').toUpperCase();
  let m = name.match(/BCF[_-](\d+)/);
  if (!m) m = name.match(/BCF(\d+)/);
  return m ? 'BCF' + m[1] : null;
}

export function isCpTag(t) {
  const name = nameOf(t);
  return name.split(/[_\s]+/).includes('cp') || /cp.*pv|pv.*cp/.test(name);
}

export function isFlowTag(t) {
  return /flow|gas|유량|n2|nh3|rx|flw|air|c3h8/.test(nameOf(t));
}

export function isSpTag(t) {
  return nameOf(t).split(/[_\s]+/).includes('sp');
}

/**
 * rawValue: tb_temp_snapshot에 저장된 원시값(서버는 더 이상 어떤 보정도 하지 않는다).
 * t.scale이 설정된 태그는 적재 시점에 이미 보정이 끝난 값이므로 그대로 반환하고,
 * scale이 없는 레거시 태그만 trend.jsp의 BCF별 하드코딩 보정을 적용한다.
 */
export function applyValueCorrection(rawValue, t) {
  if (t && t.scale != null && String(t.scale).trim() !== '') return rawValue;
  let v = rawValue;
  const name = nameOf(t);
  if (isFlowTag(t) && !isNaN(v)) {
    if (v > 30000) return NaN;
    const bcf5 = /[_-]5([_-]|$)/.test(name);
    const bcf7 = /[_-]7([_-]|$)/.test(name);
    const bcf8 = /[_-]8([_-]|$)/.test(name);
    const bcf9 = /[_-]9([_-]|$)/.test(name);
    const bcf10 = /[_-]10([_-]|$)/.test(name);
    const bcf11 = /[_-]11([_-]|$)/.test(name);
    const bcf2 = /[_-]2([_-]|$)/.test(name);
    const bcf6 = /[_-]6([_-]|$)/.test(name);
    const bcf12 = /[_-]12([_-]|$)/.test(name);
    if (/c3h8/.test(name)) {
      v = bcf7 ? v / 200
        : (bcf5 || bcf8 || bcf10 || bcf11) ? v * 0.00125
        : bcf9 ? v * 0.0049
        : bcf12 ? v * 0.1
        : bcf2 ? v * 0.00152
        : bcf6 ? v * 0.01
        : (v / 1000) * 3.1;
    } else {
      v = v >= 1000 ? v / 1000 : v / 100;
    }
  }
  if (!isNaN(v) && /cp.*pv|pv.*cp/.test(name) && /[_-]7([_-]|$)|[_-]9([_-]|$)/.test(name)) v *= 2;
  if (!isNaN(v) && /유조.*pv|pv.*유조|침탄.*pv|pv.*침탄/.test(name) && /[_-]8([_-]|$)/.test(name)) v /= 10;
  if (!isNaN(v) && /유조.*sp|sp.*유조|침탄.*sp|sp.*침탄/.test(name) && /[_-]8([_-]|$)/.test(name)) v /= 10;
  if (!isNaN(v) && /유조.*sp|sp.*유조/.test(name) && /[_-]9([_-]|$)/.test(name)) v += 9;
  if (!isNaN(v) && /cp.*pv|pv.*cp/.test(name) && /[_-]9([_-]|$)/.test(name) && v >= 60) v = 0;
  if (!isNaN(v) && /nh3/.test(name) && /[_-]9([_-]|$)/.test(name)) v /= 100;
  if (!isNaN(v) && /nh3/.test(name) && /[_-]10([_-]|$)/.test(name)) v /= 10;
  if (!isNaN(v) && /유조.*온도|온도.*유조/.test(name) && /[_-]9([_-]|$)/.test(name)) v -= 9;
  if (!isNaN(v) && /유조.*온도|온도.*유조/.test(name) && /[_-]7([_-]|$)/.test(name)) v += 8;
  return v;
}

export function buildTagColorMap(tags) {
  const map = {};
  const counter = {};
  let otherIdx = 0;
  tags.forEach((t) => {
    const equip = getEquipFromTag(t);
    if (equip === 'BCF6' || equip === 'BCF11') return; // 6/11호기는 tagColor()에서 개별 처리
    const name = nameOf(t);
    let group = null;
    if (/침탄.*pv|pv.*침탄/.test(name)) group = 'ct_pv';
    else if (/유조.*pv|pv.*유조/.test(name)) group = 'uj_pv';
    else if (/침탄.*c3h8|c3h8.*침탄/.test(name)) group = 'ct_c3h8';
    else if (/c3h8/.test(name)) group = 'c3h8';
    else if (/cp.*pv|pv.*cp/.test(name)) group = 'cp_pv';
    if (group) {
      const idx = counter[group] || 0;
      map[t.colName] = TYPE_PALETTES[group][idx % TYPE_PALETTES[group].length];
      counter[group] = idx + 1;
    } else {
      map[t.colName] = COLORS[otherIdx % COLORS.length];
      otherIdx += 1;
    }
  });
  return map;
}

export function tagColor(t, tagColorMap, allTags) {
  const equip = getEquipFromTag(t);
  const idxOf = () => {
    const i = allTags.indexOf(t);
    return i >= 0 ? i : 0;
  };
  if (equip === 'BCF11') {
    const n = nameOf(t);
    if (/1실.*온도.*pv|room1.*temp.*pv/.test(n)) return '#FF1744';
    if (/2실.*온도.*pv|room2.*temp.*pv/.test(n)) return '#FF6D00';
    if (/냉각.*pv|cool.*temp.*pv/.test(n)) return '#FFD600';
    if (/1실.*cp.*pv|room1.*cp.*pv/.test(n)) return '#00E5FF';
    if (/2실.*cp.*pv|room2.*cp.*pv/.test(n)) return '#2979FF';
    if (/1실.*온도.*sp|room1.*temp.*sp/.test(n)) return '#FF80AB';
    if (/2실.*온도.*sp|room2.*temp.*sp/.test(n)) return '#FFAB40';
    if (/냉각.*sp|cool.*temp.*sp/.test(n)) return '#FFF176';
    if (/1실.*cp.*sp|room1.*cp.*sp/.test(n)) return '#80D8FF';
    if (/2실.*cp.*sp|room2.*cp.*sp/.test(n)) return '#82B1FF';
    if (/1실.*c3h8|room1.*c3h8/.test(n)) return '#00E676';
    if (/2실.*c3h8|room2.*c3h8/.test(n)) return '#AA00FF';
    return COLORS[idxOf() % COLORS.length];
  }
  if (equip === 'BCF6') {
    const n = nameOf(t);
    if (/침탄2.*pv|pv.*침탄2/.test(n)) return '#00FF7F';
    if (/침탄.*pv|pv.*침탄/.test(n)) return '#FF1744';
    if (/유조.*pv|pv.*유조/.test(n)) return '#4ADE80';
    if (/침탄.*c3h8|c3h8.*침탄/.test(n)) return '#A855F7';
    if (/c3h8/.test(n)) return '#F472B6';
    if (/cp.*pv|pv.*cp/.test(n)) return '#22D3EE';
    return COLORS[idxOf() % COLORS.length];
  }
  if (t && t.colName && tagColorMap[t.colName]) return tagColorMap[t.colName];
  return COLORS[idxOf() % COLORS.length];
}

/** tb_temp_snapshot 행에서 태그 값을 꺼낸다 (colName 우선, tagName 대체). */
export function getSnapshotValue(row, t) {
  if (!row || !t) return NaN;
  const col = t.colName || null;
  const name = t.tagName || null;
  if (col && Object.prototype.hasOwnProperty.call(row, col)) return row[col];
  if (name && Object.prototype.hasOwnProperty.call(row, name)) return row[name];
  if (col && Object.prototype.hasOwnProperty.call(row, col.toLowerCase())) return row[col.toLowerCase()];
  return NaN;
}

export function parseTs(v) {
  if (!v) return null;
  if (typeof v === 'number') return v > 100000000000 ? v : v * 1000;
  const s = typeof v === 'string' ? (v.includes('T') ? v : v.replace(' ', 'T')) : null;
  if (!s) return null;
  const t = Date.parse(s);
  return isNaN(t) ? null : t;
}
