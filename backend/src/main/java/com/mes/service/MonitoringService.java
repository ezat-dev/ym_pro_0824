package com.mes.service;

import java.util.List;

import com.mes.common.response.PageResponse;
import com.mes.domain.monitoring.ProdStatus;
import com.mes.domain.monitoring.Integrated;
import com.mes.domain.monitoring.Alarm;
import com.mes.domain.monitoring.AlarmRank;
import com.mes.domain.monitoring.AlarmFolder;
import com.mes.domain.monitoring.AlarmTag;
import com.mes.domain.monitoring.PlcDevice;
import com.mes.domain.monitoring.Trend;
import com.mes.domain.monitoring.TempTag;
import com.mes.domain.monitoring.TempMemo;
import com.mes.domain.monitoring.LotStatus;
import com.mes.domain.monitoring.LotTracking;
import java.util.Map;

public interface MonitoringService {

    PageResponse<ProdStatus> getProdStatusList(int page, int size, String keyword);

    PageResponse<Integrated> getIntegratedList(int page, int size, String keyword);

    PageResponse<Alarm> getAlarmList(int page, int size, String keyword);

    PageResponse<Trend> getTrendList(int page, int size, String keyword);

    PageResponse<LotStatus> getLotStatusList(int page, int size, String keyword);

    PageResponse<LotTracking> getLotTrackingList(int page, int size, String keyword);

    // ── 경보모니터링 ──
    List<AlarmFolder> getAlarmFolderList();
    void createAlarmFolder(AlarmFolder folder);
    void deleteAlarmFolder(int folderId);

    List<AlarmTag> getAlarmTagList(int folderId);
    void createAlarmTag(AlarmTag tag);
    void updateAlarmTag(AlarmTag tag);
    void deleteAlarmTag(int tagId);

    List<PlcDevice> getAlarmPlcList();
    void saveAlarmPlc(PlcDevice plc);
    void deleteAlarmPlc(String plcId);

    List<Alarm> getActiveAlarms(int limit);
    List<Alarm> getAlarmHistory(int limit);
    List<Alarm> getAlarmHistoryRange(String from, String to);

    // ── 경보랭킹 (서버 사이드 GROUP BY) ──
    List<AlarmRank> getAlarmRank(String from, String to, String groupBy);
    List<Map<String, Object>> getAlarmMessageCountsByFolder(String from, String to);
    List<Map<String, Object>> getAlarmTrendOverall(int hours);
    List<Map<String, Object>> getAlarmTrendByFolder(String from, String to, String bucketUnit);
    List<Map<String, Object>> getAlarmTrendBySeverity(int hours);
    List<Map<String, Object>> getAlarmCountByFolderSeverity(int hours);
    List<Map<String, Object>> getAlarmResponseTimeTrend(int hours);

    // ── 트렌드 설정 ──
    List<TempTag> getTempTagFullList();
    void insertTempTag(TempTag tag);
    void updateTempTag(TempTag tag);
    void deleteTempTag(int tempId);
    List<Map<String, Object>> getTempSnapshotList(int limit);
    List<Map<String, Object>> getTempSnapshotRange(String from, String to);
    List<TempMemo> getMemoList(String from, String to);
    void insertMemo(TempMemo memo);
    void deleteMemo(int tcCnt);

}
