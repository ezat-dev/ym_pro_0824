package com.mes.dao;

import java.util.List;

import com.mes.domain.equipment.DownStatus;
import com.mes.domain.equipment.UtilRate;
import com.mes.domain.equipment.PowerUsage;
import com.mes.domain.equipment.History;
import com.mes.domain.equipment.RepairHist;
import com.mes.domain.equipment.SparePart;
import com.mes.domain.equipment.SparePartHistory;

/**
 * 설비관리 전체 메뉴의 데이터 접근 계약.
 */
public interface EquipmentDao {

    List<DownStatus> selectDownStatusList(int offset, int size, String keyword);

    long selectDownStatusCount(String keyword);

    List<UtilRate> selectUtilRateList(int offset, int size, String keyword);

    long selectUtilRateCount(String keyword);

    List<PowerUsage> selectPowerUsageList(int offset, int size, String keyword);

    long selectPowerUsageCount(String keyword);

    List<History> selectHistoryList(int offset, int size, String keyword);

    long selectHistoryCount(String keyword);

    List<RepairHist> selectRepairHistList(int offset, int size, String keyword);

    long selectRepairHistCount(String keyword);

    List<SparePart> selectSparePartList(String equipName, String keyword);

    List<String> selectSparePartEquipNames();

    SparePart selectSparePartById(Long id);

    void insertSparePart(SparePart sparePart);

    void updateSparePart(SparePart sparePart);

    void softDeleteSparePart(Long id);

    List<SparePartHistory> selectSparePartHistoryList(Long partId, String type, String from, String to);

    void insertSparePartHistory(SparePartHistory history);

    void deleteSparePartHistory(Long id);

}
