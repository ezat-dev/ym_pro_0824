package com.mes.dao;

import java.util.List;
import java.util.Map;

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

public interface MonitoringDao {

    List<ProdStatus> selectProdStatusList(int offset, int size, String keyword);

    long selectProdStatusCount(String keyword);

    List<Integrated> selectIntegratedList(int offset, int size, String keyword);

    long selectIntegratedCount(String keyword);

    List<Alarm> selectAlarmList(int offset, int size, String keyword);

    long selectAlarmCount(String keyword);

    List<Trend> selectTrendList(int offset, int size, String keyword);

    long selectTrendCount(String keyword);

    List<LotStatus> selectLotStatusList(int offset, int size, String keyword);

    long selectLotStatusCount(String keyword);

    List<LotTracking> selectLotTrackingList(int offset, int size, String keyword);

    long selectLotTrackingCount(String keyword);

    // ── 경보모니터링 (ez_scada 실데이터) ──
    List<AlarmFolder> selectAlarmFolderList();
    void insertAlarmFolder(AlarmFolder folder);
    void deleteAlarmFolder(int folderId);

    List<AlarmTag> selectAlarmTagList(int folderId);
    void insertAlarmTag(AlarmTag tag);
    void updateAlarmTag(AlarmTag tag);
    void deleteAlarmTag(int tagId);

    List<PlcDevice> selectAlarmPlcList();
    void insertOrUpdateAlarmPlc(PlcDevice plc);
    void deleteAlarmPlc(String plcId);

    List<Alarm> selectActiveAlarms(int limit);
    List<Alarm> selectAlarmHistory(int limit);
    List<Alarm> selectAlarmHistoryRange(Map<String, Object> params);

    List<AlarmRank> selectAlarmRankByTag(Map<String, Object> params);
    List<AlarmRank> selectAlarmRankByPlc(Map<String, Object> params);
    List<AlarmRank> selectAlarmRankByFolder(Map<String, Object> params);
    List<Map<String, Object>> selectAlarmMessageCountsByFolder(Map<String, Object> params);
    List<Map<String, Object>> selectAlarmTrendOverall(Map<String, Object> params);
    List<Map<String, Object>> selectAlarmTrendByFolder(Map<String, Object> params);
    List<Map<String, Object>> selectAlarmTrendBySeverity(Map<String, Object> params);
    List<Map<String, Object>> selectAlarmCountByFolderSeverity(Map<String, Object> params);
    List<Map<String, Object>> selectAlarmResponseTimeTrend(Map<String, Object> params);

    // ── 트렌드 설정 (ez_scada 실데이터 — TREND 차트가 그리는 온도 태그 정의) ──
    void ensureTempTagTable();
    int countTempTagColumn(String colName);
    void addTempTagColNameColumn();
    void addTempTagEquipIdColumn();
    void addTempTagScaleColumn();
    void ensureTempSnapshotTable();
    void addTempSnapshotColumn(String colName);
    int countTempSnapshotColumn(String colName);
    void renameTempSnapshotColumn(Map<String, Object> params);

    List<TempTag> selectTempTagFullList();
    TempTag selectTempTagById(int tempId);
    List<TempTag> selectTempTagsMissingColName();
    List<String> selectTempColNames();
    void insertTempTag(TempTag tag);
    void updateTempTag(TempTag tag);
    void deleteTempTag(int tempId);

    List<Map<String, Object>> selectTempSnapshotList(Map<String, Object> params);
    List<Map<String, Object>> selectTempSnapshotRange(Map<String, Object> params);

    List<TempMemo> selectMemoList(Map<String, Object> params);
    void insertMemo(TempMemo memo);
    void deleteMemo(int tcCnt);

}
