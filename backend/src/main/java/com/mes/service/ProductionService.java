package com.mes.service;

import com.mes.common.response.PageResponse;
import com.mes.domain.production.WorkOrder;
import com.mes.domain.production.ByItem;
import com.mes.domain.production.EquipEff;
import com.mes.domain.production.DailyReport;
import com.mes.domain.production.LotReport;

public interface ProductionService {

    PageResponse<WorkOrder> getWorkOrderList(int page, int size, String keyword);

    PageResponse<ByItem> getByItemList(int page, int size, String keyword);

    PageResponse<EquipEff> getEquipEffList(int page, int size, String keyword);

    PageResponse<DailyReport> getDailyReportList(int page, int size, String keyword);

    PageResponse<LotReport> getLotReportList(int page, int size, String keyword);

}
