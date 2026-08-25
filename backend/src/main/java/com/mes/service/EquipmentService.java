package com.mes.service;

import com.mes.common.response.PageResponse;
import com.mes.domain.equipment.DownStatus;
import com.mes.domain.equipment.UtilRate;
import com.mes.domain.equipment.PowerUsage;
import com.mes.domain.equipment.History;
import com.mes.domain.equipment.RepairHist;
import com.mes.domain.equipment.SparePart;

public interface EquipmentService {

    PageResponse<DownStatus> getDownStatusList(int page, int size, String keyword);

    PageResponse<UtilRate> getUtilRateList(int page, int size, String keyword);

    PageResponse<PowerUsage> getPowerUsageList(int page, int size, String keyword);

    PageResponse<History> getHistoryList(int page, int size, String keyword);

    PageResponse<RepairHist> getRepairHistList(int page, int size, String keyword);

    PageResponse<SparePart> getSparePartList(int page, int size, String keyword);

}
