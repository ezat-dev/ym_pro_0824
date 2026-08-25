package com.mes.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mes.common.response.PageResponse;
import com.mes.common.util.Paging;
import com.mes.dao.ProductionDao;
import com.mes.domain.production.WorkOrder;
import com.mes.domain.production.ByItem;
import com.mes.domain.production.EquipEff;
import com.mes.domain.production.DailyReport;
import com.mes.domain.production.LotReport;
import com.mes.service.ProductionService;

@Service
@Transactional(readOnly = true)
public class ProductionServiceImpl implements ProductionService {

    private final ProductionDao productionDao;

    public ProductionServiceImpl(ProductionDao productionDao) {
        this.productionDao = productionDao;
    }

    @Override
    public PageResponse<WorkOrder> getWorkOrderList(int page, int size, String keyword) {
        int pageNum = Paging.normalizePage(page);
        int pageSize = Paging.normalizeSize(size);
        List<WorkOrder> content = productionDao.selectWorkOrderList(Paging.offset(pageNum, pageSize), pageSize, keyword);
        long totalElements = productionDao.selectWorkOrderCount(keyword);
        return PageResponse.of(content, pageNum, pageSize, totalElements);
    }

    @Override
    public PageResponse<ByItem> getByItemList(int page, int size, String keyword) {
        int pageNum = Paging.normalizePage(page);
        int pageSize = Paging.normalizeSize(size);
        List<ByItem> content = productionDao.selectByItemList(Paging.offset(pageNum, pageSize), pageSize, keyword);
        long totalElements = productionDao.selectByItemCount(keyword);
        return PageResponse.of(content, pageNum, pageSize, totalElements);
    }

    @Override
    public PageResponse<EquipEff> getEquipEffList(int page, int size, String keyword) {
        int pageNum = Paging.normalizePage(page);
        int pageSize = Paging.normalizeSize(size);
        List<EquipEff> content = productionDao.selectEquipEffList(Paging.offset(pageNum, pageSize), pageSize, keyword);
        long totalElements = productionDao.selectEquipEffCount(keyword);
        return PageResponse.of(content, pageNum, pageSize, totalElements);
    }

    @Override
    public PageResponse<DailyReport> getDailyReportList(int page, int size, String keyword) {
        int pageNum = Paging.normalizePage(page);
        int pageSize = Paging.normalizeSize(size);
        List<DailyReport> content = productionDao.selectDailyReportList(Paging.offset(pageNum, pageSize), pageSize, keyword);
        long totalElements = productionDao.selectDailyReportCount(keyword);
        return PageResponse.of(content, pageNum, pageSize, totalElements);
    }

    @Override
    public PageResponse<LotReport> getLotReportList(int page, int size, String keyword) {
        int pageNum = Paging.normalizePage(page);
        int pageSize = Paging.normalizeSize(size);
        List<LotReport> content = productionDao.selectLotReportList(Paging.offset(pageNum, pageSize), pageSize, keyword);
        long totalElements = productionDao.selectLotReportCount(keyword);
        return PageResponse.of(content, pageNum, pageSize, totalElements);
    }

}
