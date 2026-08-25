package com.mes.dao;

import java.util.List;

import com.mes.domain.monitoring.ProdStatus;
import com.mes.domain.monitoring.Integrated;
import com.mes.domain.monitoring.Alarm;
import com.mes.domain.monitoring.AlarmRank;
import com.mes.domain.monitoring.Trend;
import com.mes.domain.monitoring.LotStatus;
import com.mes.domain.monitoring.LotTracking;

/**
 * 모니터링 전체 메뉴의 데이터 접근 계약.
 */
public interface MonitoringDao {

    List<ProdStatus> selectProdStatusList(int offset, int size, String keyword);

    long selectProdStatusCount(String keyword);

    List<Integrated> selectIntegratedList(int offset, int size, String keyword);

    long selectIntegratedCount(String keyword);

    List<Alarm> selectAlarmList(int offset, int size, String keyword);

    long selectAlarmCount(String keyword);

    List<AlarmRank> selectAlarmRankList(int offset, int size, String keyword);

    long selectAlarmRankCount(String keyword);

    List<Trend> selectTrendList(int offset, int size, String keyword);

    long selectTrendCount(String keyword);

    List<LotStatus> selectLotStatusList(int offset, int size, String keyword);

    long selectLotStatusCount(String keyword);

    List<LotTracking> selectLotTrackingList(int offset, int size, String keyword);

    long selectLotTrackingCount(String keyword);

}
