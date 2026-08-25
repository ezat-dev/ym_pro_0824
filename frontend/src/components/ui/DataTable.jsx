import { useEffect, useRef } from 'react';
import { TabulatorFull as Tabulator } from 'tabulator-tables';

/**
 * tabulator-tables 초기화/해제/데이터 갱신을 감싸는 공용 테이블.
 * UserPage / AuthPage / LoginHistPage가 동일한 패턴으로 재사용한다.
 */
export default function DataTable({ data, columns, options, height = '520px', onTableReady }) {
  const elRef = useRef(null);
  const tableRef = useRef(null);
  const builtRef = useRef(false);

  useEffect(() => {
    builtRef.current = false;
    tableRef.current = new Tabulator(elRef.current, {
      data,
      columns,
      layout: 'fitColumns',
      height,
      rowHeight: 44,
      placeholder: '데이터가 없습니다.',
      pagination: true,
      paginationSize: 10,
      paginationSizeSelector: [10, 20, 50, 100],
      paginationCounter: 'rows',
      ...options,
    });
    tableRef.current.on('tableBuilt', () => {
      builtRef.current = true;
      onTableReady?.(tableRef.current);
    });

    return () => {
      tableRef.current?.destroy();
      tableRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns]);

  useEffect(() => {
    const table = tableRef.current;
    if (!table) return;
    if (builtRef.current) {
      table.replaceData(data);
    } else {
      table.on('tableBuilt', () => table.replaceData(data));
    }
  }, [data]);

  return (
    <div className="mes-table-wrap">
      <div ref={elRef} />
    </div>
  );
}
