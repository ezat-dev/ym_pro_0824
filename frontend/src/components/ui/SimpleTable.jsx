import { useMemo, useState } from 'react';
import './SimpleTable.css';

/**
 * Tabulator를 쓰지 않는 순수 CSS Grid 기반 표.
 * 대부분 컬럼은 고정폭(px)이고, 마지막 컬럼만 minmax(width, 1fr)로 남는 공간을 실제로
 * 흡수한다 — 배경색만 이어붙이는 게 아니라 그리드 트랙 자체가 끝까지 채워지므로 화면 폭이
 * 얼마든 정확히 예측 가능하다(브라우저 Grid 엔진이 계산 — 서드파티 라이브러리 추정 불필요).
 *
 * columns: [{ key, title, width, align?, sortValue?(row), render?(row, index), onCellClick?(row) }]
 */
export default function SimpleTable({
  columns,
  data,
  rowKey,
  onRowDoubleClick,
  selectable = false,
  selectedKeys,
  onSelectionChange,
  loading = false,
  emptyText = '데이터가 없습니다.',
}) {
  const [sort, setSort] = useState(null);

  const sorted = useMemo(() => {
    if (!sort) return data;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return data;
    return [...data].sort((a, b) => {
      const av = col.sortValue(a);
      const bv = col.sortValue(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (av < bv) return -1 * sort.dir;
      if (av > bv) return 1 * sort.dir;
      return 0;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, sort]);

  const gridTemplate = useMemo(() => {
    const parts = selectable ? ['40px'] : [];
    columns.forEach((c, i) => {
      const isLast = i === columns.length - 1;
      parts.push(isLast ? `minmax(${c.width}px, 1fr)` : `${c.width}px`);
    });
    return parts.join(' ');
  }, [columns, selectable]);

  const allSelected = selectable && data.length > 0 && data.every((r) => selectedKeys?.has(rowKey(r)));

  const toggleAll = () => {
    if (!onSelectionChange) return;
    onSelectionChange(allSelected ? new Set() : new Set(data.map(rowKey)));
  };

  const toggleOne = (key) => {
    if (!onSelectionChange) return;
    const next = new Set(selectedKeys);
    if (next.has(key)) next.delete(key); else next.add(key);
    onSelectionChange(next);
  };

  const handleSortClick = (col) => {
    if (!col.sortValue) return;
    setSort((prev) => {
      if (!prev || prev.key !== col.key) return { key: col.key, dir: 1 };
      if (prev.dir === 1) return { key: col.key, dir: -1 };
      return null;
    });
  };

  return (
    <div className="stbl-wrap">
      <div className="stbl-scroll-x">
      <div className="stbl-header-row" style={{ gridTemplateColumns: gridTemplate }}>
        {selectable && (
          <div className="stbl-cell stbl-check-cell">
            <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="전체 선택" />
          </div>
        )}
        {columns.map((col) => (
          <div
            key={col.key}
            className={`stbl-cell stbl-head-cell${col.sortValue ? ' sortable' : ''}`}
            style={{ justifyContent: alignToJustify(col.align) }}
            onClick={() => handleSortClick(col)}
          >
            <span>{col.title}</span>
            {col.sortValue && (
              <span className={`stbl-sort-arrow${sort?.key === col.key ? ' active' : ''}`}>
                {sort?.key === col.key && sort.dir === -1 ? '▼' : '▲'}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="stbl-body">
        {loading ? (
          <div className="stbl-empty">불러오는 중...</div>
        ) : sorted.length === 0 ? (
          <div className="stbl-empty">{emptyText}</div>
        ) : (
          sorted.map((row, idx) => {
            const key = rowKey(row);
            const selected = !!selectedKeys?.has(key);
            return (
              <div
                key={key}
                className={`stbl-row${idx % 2 === 1 ? ' odd' : ''}${selected ? ' selected' : ''}`}
                style={{ gridTemplateColumns: gridTemplate }}
                onDoubleClick={() => onRowDoubleClick?.(row)}
              >
                {selectable && (
                  <div className="stbl-cell stbl-check-cell" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={selected} onChange={() => toggleOne(key)} aria-label="행 선택" />
                  </div>
                )}
                {columns.map((col) => (
                  <div
                    key={col.key}
                    className={`stbl-cell${col.onCellClick ? ' clickable' : ''}`}
                    style={{ justifyContent: alignToJustify(col.align) }}
                    onClick={col.onCellClick ? (e) => { e.stopPropagation(); col.onCellClick(row); } : undefined}
                  >
                    {col.render ? col.render(row, idx) : row[col.key]}
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>
      </div>
    </div>
  );
}

function alignToJustify(align) {
  if (align === 'right') return 'flex-end';
  if (align === 'center') return 'center';
  return 'flex-start';
}
