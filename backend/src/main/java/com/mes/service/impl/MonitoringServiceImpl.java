package com.mes.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mes.common.response.PageResponse;
import com.mes.common.util.Paging;
import com.mes.dao.MonitoringDao;
import com.mes.domain.monitoring.ProdStatus;
import com.mes.domain.monitoring.Integrated;
import com.mes.domain.monitoring.Alarm;
import com.mes.domain.monitoring.AlarmRank;
import com.mes.domain.monitoring.Trend;
import com.mes.domain.monitoring.LotStatus;
import com.mes.domain.monitoring.LotTracking;
import com.mes.service.MonitoringService;

@Service
@Transactional(readOnly = true)
public class MonitoringServiceImpl implements MonitoringService {

    private final MonitoringDao monitoringDao;

    public MonitoringServiceImpl(MonitoringDao monitoringDao) {
        this.monitoringDao = monitoringDao;
    }

    @Override
    public PageResponse<ProdStatus> getProdStatusList(int page, int size, String keyword) {
        int pageNum = Paging.normalizePage(page);
        int pageSize = Paging.normalizeSize(size);
        List<ProdStatus> content = monitoringDao.selectProdStatusList(Paging.offset(pageNum, pageSize), pageSize, keyword);
        long totalElements = monitoringDao.selectProdStatusCount(keyword);
        return PageResponse.of(content, pageNum, pageSize, totalElements);
    }

    @Override
    public PageResponse<Integrated> getIntegratedList(int page, int size, String keyword) {
        int pageNum = Paging.normalizePage(page);
        int pageSize = Paging.normalizeSize(size);
        List<Integrated> content = monitoringDao.selectIntegratedList(Paging.offset(pageNum, pageSize), pageSize, keyword);
        long totalElements = monitoringDao.selectIntegratedCount(keyword);
        return PageResponse.of(content, pageNum, pageSize, totalElements);
    }

    @Override
    public PageResponse<Alarm> getAlarmList(int page, int size, String keyword) {
        int pageNum = Paging.normalizePage(page);
        int pageSize = Paging.normalizeSize(size);
        List<Alarm> content = monitoringDao.selectAlarmList(Paging.offset(pageNum, pageSize), pageSize, keyword);
        long totalElements = monitoringDao.selectAlarmCount(keyword);
        return PageResponse.of(content, pageNum, pageSize, totalElements);
    }

    @Override
    public PageResponse<AlarmRank> getAlarmRankList(int page, int size, String keyword) {
        int pageNum = Paging.normalizePage(page);
        int pageSize = Paging.normalizeSize(size);
        List<AlarmRank> content = monitoringDao.selectAlarmRankList(Paging.offset(pageNum, pageSize), pageSize, keyword);
        long totalElements = monitoringDao.selectAlarmRankCount(keyword);
        return PageResponse.of(content, pageNum, pageSize, totalElements);
    }

    @Override
    public PageResponse<Trend> getTrendList(int page, int size, String keyword) {
        int pageNum = Paging.normalizePage(page);
        int pageSize = Paging.normalizeSize(size);
        List<Trend> content = monitoringDao.selectTrendList(Paging.offset(pageNum, pageSize), pageSize, keyword);
        long totalElements = monitoringDao.selectTrendCount(keyword);
        return PageResponse.of(content, pageNum, pageSize, totalElements);
    }

    @Override
    public PageResponse<LotStatus> getLotStatusList(int page, int size, String keyword) {
        int pageNum = Paging.normalizePage(page);
        int pageSize = Paging.normalizeSize(size);
        List<LotStatus> content = monitoringDao.selectLotStatusList(Paging.offset(pageNum, pageSize), pageSize, keyword);
        long totalElements = monitoringDao.selectLotStatusCount(keyword);
        return PageResponse.of(content, pageNum, pageSize, totalElements);
    }

    @Override
    public PageResponse<LotTracking> getLotTrackingList(int page, int size, String keyword) {
        int pageNum = Paging.normalizePage(page);
        int pageSize = Paging.normalizeSize(size);
        List<LotTracking> content = monitoringDao.selectLotTrackingList(Paging.offset(pageNum, pageSize), pageSize, keyword);
        long totalElements = monitoringDao.selectLotTrackingCount(keyword);
        return PageResponse.of(content, pageNum, pageSize, totalElements);
    }

}
