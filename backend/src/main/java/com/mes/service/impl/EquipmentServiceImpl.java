package com.mes.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mes.common.response.PageResponse;
import com.mes.common.util.Paging;
import com.mes.dao.EquipmentDao;
import com.mes.domain.equipment.DownStatus;
import com.mes.domain.equipment.UtilRate;
import com.mes.domain.equipment.PowerUsage;
import com.mes.domain.equipment.History;
import com.mes.domain.equipment.RepairHist;
import com.mes.domain.equipment.SparePart;
import com.mes.service.EquipmentService;

@Service
@Transactional(readOnly = true)
public class EquipmentServiceImpl implements EquipmentService {

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
    public PageResponse<SparePart> getSparePartList(int page, int size, String keyword) {
        int pageNum = Paging.normalizePage(page);
        int pageSize = Paging.normalizeSize(size);
        List<SparePart> content = equipmentDao.selectSparePartList(Paging.offset(pageNum, pageSize), pageSize, keyword);
        long totalElements = equipmentDao.selectSparePartCount(keyword);
        return PageResponse.of(content, pageNum, pageSize, totalElements);
    }

}
