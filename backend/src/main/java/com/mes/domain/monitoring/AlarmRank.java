package com.mes.domain.monitoring;

import java.time.LocalDateTime;

/**
 * 모니터링 > 경보랭킹 1행 — 서버에서 GROUP BY + COUNT(*)로 직접 집계한다.
 * (sample_pro는 최근 1000건을 클라이언트에서 집계했는데, 전체 기간 랭킹이 그 캡에 걸리는
 * 버그가 있어 이식하지 않고 여기서는 제대로 된 서버 집계로 대체했다.)
 */
public class AlarmRank {

    private String groupKey;
    private String label;
    private long count;
    private LocalDateTime lastOccurTime;

    public String getGroupKey() {
        return groupKey;
    }

    public void setGroupKey(String groupKey) {
        this.groupKey = groupKey;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public long getCount() {
        return count;
    }

    public void setCount(long count) {
        this.count = count;
    }

    public LocalDateTime getLastOccurTime() {
        return lastOccurTime;
    }

    public void setLastOccurTime(LocalDateTime lastOccurTime) {
        this.lastOccurTime = lastOccurTime;
    }
}
