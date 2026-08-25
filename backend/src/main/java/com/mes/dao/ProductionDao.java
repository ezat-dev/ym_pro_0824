package com.mes.dao;

import java.util.List;

import com.mes.domain.production.WorkOrder;
import com.mes.domain.production.ByItem;
import com.mes.domain.production.EquipEff;
import com.mes.domain.production.DailyReport;
import com.mes.domain.production.LotReport;

/**
 * 생산관리 전체 메뉴의 데이터 접근 계약.
 */
public interface ProductionDao {

    List<WorkOrder> selectWorkOrderList(int offset, int size, String keyword);

    long selectWorkOrderCount(String keyword);

    List<ByItem> selectByItemList(int offset, int size, String keyword);

    long selectByItemCount(String keyword);

    List<EquipEff> selectEquipEffList(int offset, int size, String keyword);

    long selectEquipEffCount(String keyword);

    List<DailyReport> selectDailyReportList(int offset, int size, String keyword);

    long selectDailyReportCount(String keyword);

    List<LotReport> selectLotReportList(int offset, int size, String keyword);

    long selectLotReportCount(String keyword);

}
