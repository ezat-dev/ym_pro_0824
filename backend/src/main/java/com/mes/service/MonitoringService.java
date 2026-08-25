package com.mes.service;

import com.mes.common.response.PageResponse;
import com.mes.domain.monitoring.ProdStatus;
import com.mes.domain.monitoring.Integrated;
import com.mes.domain.monitoring.Alarm;
import com.mes.domain.monitoring.AlarmRank;
import com.mes.domain.monitoring.Trend;
import com.mes.domain.monitoring.LotStatus;
import com.mes.domain.monitoring.LotTracking;

public interface MonitoringService {

    PageResponse<ProdStatus> getProdStatusList(int page, int size, String keyword);

    PageResponse<Integrated> getIntegratedList(int page, int size, String keyword);

    PageResponse<Alarm> getAlarmList(int page, int size, String keyword);

    PageResponse<AlarmRank> getAlarmRankList(int page, int size, String keyword);

    PageResponse<Trend> getTrendList(int page, int size, String keyword);

    PageResponse<LotStatus> getLotStatusList(int page, int size, String keyword);

    PageResponse<LotTracking> getLotTrackingList(int page, int size, String keyword);

}
