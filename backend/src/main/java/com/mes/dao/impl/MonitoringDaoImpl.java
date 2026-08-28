package com.mes.dao.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Repository;

import com.mes.dao.MonitoringDao;
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

@Repository
public class MonitoringDaoImpl implements MonitoringDao {

    private final SqlSessionTemplate sqlSession;
    private final SqlSessionTemplate ezScadaSession;

    public MonitoringDaoImpl(SqlSessionTemplate sqlSession,
            @Qualifier("ezScadaSession") SqlSessionTemplate ezScadaSession) {
        this.sqlSession = sqlSession;
        this.ezScadaSession = ezScadaSession;
    }

    @Override
    public List<ProdStatus> selectProdStatusList(int offset, int size, String keyword) {
        return sqlSession.selectList("ProdStatusMapper.selectList", params(offset, size, keyword));
    }

    @Override
    public long selectProdStatusCount(String keyword) {
        Long count = sqlSession.selectOne("ProdStatusMapper.selectCount", params(0, 0, keyword));
        return count == null ? 0L : count;
    }

    @Override
    public List<Integrated> selectIntegratedList(int offset, int size, String keyword) {
        return sqlSession.selectList("IntegratedMapper.selectList", params(offset, size, keyword));
    }

    @Override
    public long selectIntegratedCount(String keyword) {
        Long count = sqlSession.selectOne("IntegratedMapper.selectCount", params(0, 0, keyword));
        return count == null ? 0L : count;
    }

    @Override
    public List<Alarm> selectAlarmList(int offset, int size, String keyword) {
        return ezScadaSession.selectList("AlarmMapper.selectList", params(offset, size, keyword));
    }

    @Override
    public long selectAlarmCount(String keyword) {
        Long count = ezScadaSession.selectOne("AlarmMapper.selectCount", params(0, 0, keyword));
        return count == null ? 0L : count;
    }

    @Override
    public List<Trend> selectTrendList(int offset, int size, String keyword) {
        return sqlSession.selectList("TrendMapper.selectList", params(offset, size, keyword));
    }

    @Override
    public long selectTrendCount(String keyword) {
        Long count = sqlSession.selectOne("TrendMapper.selectCount", params(0, 0, keyword));
        return count == null ? 0L : count;
    }

    @Override
    public List<LotStatus> selectLotStatusList(int offset, int size, String keyword) {
        return sqlSession.selectList("LotStatusMapper.selectList", params(offset, size, keyword));
    }

    @Override
    public long selectLotStatusCount(String keyword) {
        Long count = sqlSession.selectOne("LotStatusMapper.selectCount", params(0, 0, keyword));
        return count == null ? 0L : count;
    }

    @Override
    public List<LotTracking> selectLotTrackingList(int offset, int size, String keyword) {
        return sqlSession.selectList("LotTrackingMapper.selectList", params(offset, size, keyword));
    }

    @Override
    public long selectLotTrackingCount(String keyword) {
        Long count = sqlSession.selectOne("LotTrackingMapper.selectCount", params(0, 0, keyword));
        return count == null ? 0L : count;
    }

    // ── 경보모니터링 (ez_scada, ezScadaSession) ──

    @Override
    public List<AlarmFolder> selectAlarmFolderList() {
        return ezScadaSession.selectList("AlarmMapper.selectAlarmFolderList");
    }

    @Override
    public void insertAlarmFolder(AlarmFolder folder) {
        ezScadaSession.insert("AlarmMapper.insertAlarmFolder", folder);
    }

    @Override
    public void deleteAlarmFolder(int folderId) {
        ezScadaSession.delete("AlarmMapper.deleteAlarmFolder", folderId);
    }

    @Override
    public List<AlarmTag> selectAlarmTagList(int folderId) {
        return ezScadaSession.selectList("AlarmMapper.selectAlarmTagList", folderId);
    }

    @Override
    public void insertAlarmTag(AlarmTag tag) {
        ezScadaSession.insert("AlarmMapper.insertAlarmTag", tag);
    }

    @Override
    public void updateAlarmTag(AlarmTag tag) {
        ezScadaSession.update("AlarmMapper.updateAlarmTag", tag);
    }

    @Override
    public void deleteAlarmTag(int tagId) {
        ezScadaSession.delete("AlarmMapper.deleteAlarmTag", tagId);
    }

    @Override
    public List<PlcDevice> selectAlarmPlcList() {
        return ezScadaSession.selectList("AlarmMapper.selectPlcList");
    }

    @Override
    public void insertOrUpdateAlarmPlc(PlcDevice plc) {
        ezScadaSession.insert("AlarmMapper.insertOrUpdatePlc", plc);
    }

    @Override
    public void deleteAlarmPlc(String plcId) {
        ezScadaSession.delete("AlarmMapper.deletePlc", plcId);
    }

    @Override
    public List<Alarm> selectActiveAlarms(int limit) {
        Map<String, Object> p = new HashMap<>();
        p.put("limit", limit);
        return ezScadaSession.selectList("AlarmMapper.selectActiveAlarms", p);
    }

    @Override
    public List<Alarm> selectAlarmHistory(int limit) {
        Map<String, Object> p = new HashMap<>();
        p.put("limit", limit);
        return ezScadaSession.selectList("AlarmMapper.selectAlarmHistory", p);
    }

    @Override
    public List<Alarm> selectAlarmHistoryRange(Map<String, Object> params) {
        return ezScadaSession.selectList("AlarmMapper.selectAlarmHistoryRange", params);
    }

    @Override
    public List<AlarmRank> selectAlarmRankByTag(Map<String, Object> params) {
        return ezScadaSession.selectList("AlarmMapper.selectAlarmRankByTag", params);
    }

    @Override
    public List<AlarmRank> selectAlarmRankByPlc(Map<String, Object> params) {
        return ezScadaSession.selectList("AlarmMapper.selectAlarmRankByPlc", params);
    }

    @Override
    public List<AlarmRank> selectAlarmRankByFolder(Map<String, Object> params) {
        return ezScadaSession.selectList("AlarmMapper.selectAlarmRankByFolder", params);
    }

    @Override
    public List<Map<String, Object>> selectAlarmMessageCountsByFolder(Map<String, Object> params) {
        return ezScadaSession.selectList("AlarmMapper.selectAlarmMessageCountsByFolder", params);
    }

    @Override
    public List<Map<String, Object>> selectAlarmTrendOverall(Map<String, Object> params) {
        return ezScadaSession.selectList("AlarmMapper.selectAlarmTrendOverall", params);
    }

    @Override
    public List<Map<String, Object>> selectAlarmTrendByFolder(Map<String, Object> params) {
        return ezScadaSession.selectList("AlarmMapper.selectAlarmTrendByFolder", params);
    }

    @Override
    public List<Map<String, Object>> selectAlarmTrendBySeverity(Map<String, Object> params) {
        return ezScadaSession.selectList("AlarmMapper.selectAlarmTrendBySeverity", params);
    }

    @Override
    public List<Map<String, Object>> selectAlarmCountByFolderSeverity(Map<String, Object> params) {
        return ezScadaSession.selectList("AlarmMapper.selectAlarmCountByFolderSeverity", params);
    }

    @Override
    public List<Map<String, Object>> selectAlarmResponseTimeTrend(Map<String, Object> params) {
        return ezScadaSession.selectList("AlarmMapper.selectAlarmResponseTimeTrend", params);
    }

    // ── 트렌드 설정 (ez_scada, ezScadaSession) ──

    @Override
    public void ensureTempTagTable() {
        ezScadaSession.update("TrendSettingsMapper.ensureTempTagTable");
    }

    @Override
    public int countTempTagColumn(String colName) {
        return ezScadaSession.selectOne("TrendSettingsMapper.countTempTagColumn", colName);
    }

    @Override
    public void addTempTagColNameColumn() {
        ezScadaSession.update("TrendSettingsMapper.addTempTagColNameColumn");
    }

    @Override
    public void addTempTagEquipIdColumn() {
        ezScadaSession.update("TrendSettingsMapper.addTempTagEquipIdColumn");
    }

    @Override
    public void addTempTagScaleColumn() {
        ezScadaSession.update("TrendSettingsMapper.addTempTagScaleColumn");
    }

    @Override
    public void ensureTempSnapshotTable() {
        ezScadaSession.update("TrendSettingsMapper.ensureTempSnapshotTable");
    }

    @Override
    public void addTempSnapshotColumn(String colName) {
        ezScadaSession.update("TrendSettingsMapper.addTempSnapshotColumn", colName);
    }

    @Override
    public int countTempSnapshotColumn(String colName) {
        return ezScadaSession.selectOne("TrendSettingsMapper.countTempSnapshotColumn", colName);
    }

    @Override
    public void renameTempSnapshotColumn(Map<String, Object> params) {
        ezScadaSession.update("TrendSettingsMapper.renameTempSnapshotColumn", params);
    }

    @Override
    public List<TempTag> selectTempTagFullList() {
        return ezScadaSession.selectList("TrendSettingsMapper.selectTempTagFullList");
    }

    @Override
    public TempTag selectTempTagById(int tempId) {
        return ezScadaSession.selectOne("TrendSettingsMapper.selectTempTagById", tempId);
    }

    @Override
    public List<TempTag> selectTempTagsMissingColName() {
        return ezScadaSession.selectList("TrendSettingsMapper.selectTempTagsMissingColName");
    }

    @Override
    public List<String> selectTempColNames() {
        return ezScadaSession.selectList("TrendSettingsMapper.selectTempColNames");
    }

    @Override
    public void insertTempTag(TempTag tag) {
        ezScadaSession.insert("TrendSettingsMapper.insertTempTag", tag);
    }

    @Override
    public void updateTempTag(TempTag tag) {
        ezScadaSession.update("TrendSettingsMapper.updateTempTag", tag);
    }

    @Override
    public void deleteTempTag(int tempId) {
        ezScadaSession.delete("TrendSettingsMapper.deleteTempTag", tempId);
    }

    @Override
    public List<Map<String, Object>> selectTempSnapshotList(Map<String, Object> params) {
        return ezScadaSession.selectList("TrendSettingsMapper.selectTempSnapshotList", params);
    }

    @Override
    public List<Map<String, Object>> selectTempSnapshotRange(Map<String, Object> params) {
        return ezScadaSession.selectList("TrendSettingsMapper.selectTempSnapshotRange", params);
    }

    @Override
    public List<TempMemo> selectMemoList(Map<String, Object> params) {
        return ezScadaSession.selectList("TrendSettingsMapper.selectMemoList", params);
    }

    @Override
    public void insertMemo(TempMemo memo) {
        ezScadaSession.insert("TrendSettingsMapper.insertMemo", memo);
    }

    @Override
    public void deleteMemo(int tcCnt) {
        ezScadaSession.update("TrendSettingsMapper.deleteMemo", tcCnt);
    }

    private Map<String, Object> params(int offset, int size, String keyword) {
        Map<String, Object> p = new HashMap<>();
        p.put("offset", offset);
        p.put("size", size);
        p.put("keyword", keyword);
        return p;
    }
}
