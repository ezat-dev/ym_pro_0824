package com.mes.service.impl;

import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mes.common.exception.BusinessException;
import com.mes.common.exception.ErrorCode;
import com.mes.common.response.PageResponse;
import com.mes.common.util.Paging;
import com.mes.dao.EquipmentDao;
import com.mes.domain.equipment.DownStatus;
import com.mes.domain.equipment.UtilRate;
import com.mes.domain.equipment.PowerUsage;
import com.mes.domain.equipment.History;
import com.mes.domain.equipment.RepairHist;
import com.mes.domain.equipment.SparePart;
import com.mes.domain.equipment.SparePartHistory;
import com.mes.service.EquipmentService;

@Service
@Transactional(readOnly = true)
public class EquipmentServiceImpl implements EquipmentService {

    private static final Set<String> SPARE_PART_HISTORY_TYPES = Set.of("IN", "OUT");

    private final EquipmentDao equipmentDao;

    public EquipmentServiceImpl(EquipmentDao equipmentDao) {
        this.equipmentDao = equipmentDao;
    }

    @Override
    public PageResponse<DownStatus> getDownStatusList(int page, int size, String keyword) {
        int pageNum = Paging.normalizePage(page);
        int pageSize = Paging.normalizeSize(size);
        List<DownStatus> content = equipmentDao.selectDownStatusList(Paging.offset(pageNum, pageSize), pageSize, keyword);
        long totalElements = equipmentDao.selectDownStatusCount(keyword);
        return PageResponse.of(content, pageNum, pageSize, totalElements);
    }

    @Override
    public PageResponse<UtilRate> getUtilRateList(int page, int size, String keyword) {
        int pageNum = Paging.normalizePage(page);
        int pageSize = Paging.normalizeSize(size);
        List<UtilRate> content = equipmentDao.selectUtilRateList(Paging.offset(pageNum, pageSize), pageSize, keyword);
        long totalElements = equipmentDao.selectUtilRateCount(keyword);
        return PageResponse.of(content, pageNum, pageSize, totalElements);
    }

    @Override
    public PageResponse<PowerUsage> getPowerUsageList(int page, int size, String keyword) {
        int pageNum = Paging.normalizePage(page);
        int pageSize = Paging.normalizeSize(size);
        List<PowerUsage> content = equipmentDao.selectPowerUsageList(Paging.offset(pageNum, pageSize), pageSize, keyword);
        long totalElements = equipmentDao.selectPowerUsageCount(keyword);
        return PageResponse.of(content, pageNum, pageSize, totalElements);
    }

    @Override
    public PageResponse<History> getHistoryList(int page, int size, String keyword) {
        int pageNum = Paging.normalizePage(page);
        int pageSize = Paging.normalizeSize(size);
        List<History> content = equipmentDao.selectHistoryList(Paging.offset(pageNum, pageSize), pageSize, keyword);
        long totalElements = equipmentDao.selectHistoryCount(keyword);
        return PageResponse.of(content, pageNum, pageSize, totalElements);
    }

    @Override
    public PageResponse<RepairHist> getRepairHistList(int page, int size, String keyword) {
        int pageNum = Paging.normalizePage(page);
        int pageSize = Paging.normalizeSize(size);
        List<RepairHist> content = equipmentDao.selectRepairHistList(Paging.offset(pageNum, pageSize), pageSize, keyword);
        long totalElements = equipmentDao.selectRepairHistCount(keyword);
        return PageResponse.of(content, pageNum, pageSize, totalElements);
    }

    @Override
    public List<SparePart> getSparePartList(String equipName, String keyword) {
        return equipmentDao.selectSparePartList(equipName, keyword);
    }

    @Override
    public List<String> getSparePartEquipNames() {
        return equipmentDao.selectSparePartEquipNames();
    }

    @Override
    public SparePart getSparePartById(Long id) {
        SparePart sparePart = equipmentDao.selectSparePartById(id);
        if (sparePart == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "부품 정보를 찾을 수 없습니다.");
        }
        return sparePart;
    }

    @Override
    @Transactional
    public SparePart createSparePart(SparePart sparePart, Integer initialQty, String regUserName) {
        sparePart.setRegUserName(regUserName == null ? "" : regUserName);
        equipmentDao.insertSparePart(sparePart);
        if (initialQty != null && initialQty > 0) {
            SparePartHistory history = new SparePartHistory();
            history.setSparePartId(sparePart.getId());
            history.setType("IN");
            history.setQty(initialQty);
            history.setWorkDesc("최초 등록");
            history.setRegUserName(regUserName == null ? "" : regUserName);
            equipmentDao.insertSparePartHistory(history);
        }
        return getSparePartById(sparePart.getId());
    }

    @Override
    @Transactional
    public void updateSparePart(SparePart sparePart) {
        equipmentDao.updateSparePart(sparePart);
    }

    @Override
    @Transactional
    public void deleteSpareParts(List<Long> ids) {
        for (Long id : ids) {
            equipmentDao.softDeleteSparePart(id);
        }
    }

    @Override
    public List<SparePartHistory> getSparePartHistoryList(Long partId, String type, String from, String to) {
        return equipmentDao.selectSparePartHistoryList(partId, type, from, to);
    }

    @Override
    @Transactional
    public void createSparePartHistory(SparePartHistory history) {
        if (!SPARE_PART_HISTORY_TYPES.contains(history.getType())) {
            throw new BusinessException(ErrorCode.INVALID_PARAMETER, "구분은 IN 또는 OUT이어야 합니다.");
        }
        if (history.getQty() == null || history.getQty() <= 0) {
            throw new BusinessException(ErrorCode.INVALID_PARAMETER, "수량은 1 이상이어야 합니다.");
        }
        equipmentDao.insertSparePartHistory(history);
    }

    @Override
    @Transactional
    public void deleteSparePartHistory(Long id) {
        equipmentDao.deleteSparePartHistory(id);
    }

}
