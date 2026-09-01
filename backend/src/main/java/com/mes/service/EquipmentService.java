package com.mes.service;

import java.util.List;

import com.mes.common.response.PageResponse;
import com.mes.domain.equipment.DownStatus;
import com.mes.domain.equipment.UtilRate;
import com.mes.domain.equipment.PowerUsage;
import com.mes.domain.equipment.History;
import com.mes.domain.equipment.RepairHist;
import com.mes.domain.equipment.SparePart;
import com.mes.domain.equipment.SparePartHistory;

public interface EquipmentService {

    PageResponse<DownStatus> getDownStatusList(int page, int size, String keyword);

    PageResponse<UtilRate> getUtilRateList(int page, int size, String keyword);

    PageResponse<PowerUsage> getPowerUsageList(int page, int size, String keyword);

    PageResponse<History> getHistoryList(int page, int size, String keyword);

    PageResponse<RepairHist> getRepairHistList(int page, int size, String keyword);

    List<SparePart> getSparePartList(String equipName, String keyword);

    List<String> getSparePartEquipNames();

    SparePart getSparePartById(Long id);

    SparePart createSparePart(SparePart sparePart, Integer initialQty, String regUserName);

    void updateSparePart(SparePart sparePart);

    void deleteSpareParts(List<Long> ids);

    List<SparePartHistory> getSparePartHistoryList(Long partId, String type, String from, String to);

    void createSparePartHistory(SparePartHistory history);

    void deleteSparePartHistory(Long id);

}
