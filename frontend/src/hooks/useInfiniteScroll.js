import { useCallback, useState } from 'react';

const DEFAULT_STEP = 30;
const LOAD_MORE_THRESHOLD_PX = 120;

// 페이지 번호 대신 스크롤로 더 불러오는 목록에서 공용으로 쓰는 훅.
// 이미 전량을 클라이언트에 받아둔 배열을 대상으로 하므로, 서버 재조회가 아니라
// 그냥 보여주는 개수(visibleCount)만 늘려나간다.
export function useInfiniteScroll(step = DEFAULT_STEP) {
  const [visibleCount, setVisibleCount] = useState(step);

  const reset = useCallback(() => setVisibleCount(step), [step]);

  const onScroll = useCallback((e) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - LOAD_MORE_THRESHOLD_PX) {
      setVisibleCount((c) => c + step);
    }
  }, [step]);

  return { visibleCount, onScroll, reset };
}
