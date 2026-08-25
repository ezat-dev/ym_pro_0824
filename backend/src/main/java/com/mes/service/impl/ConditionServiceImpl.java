package com.mes.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mes.common.response.PageResponse;
import com.mes.common.util.Paging;
import com.mes.dao.ConditionDao;
import com.mes.domain.condition.Sensor;
import com.mes.domain.condition.Regulator;
import com.mes.domain.condition.OilAnalysis;
import com.mes.domain.condition.DailyCheck;
import com.mes.domain.condition.Standard;
import com.mes.service.ConditionService;

@Service
@Transactional(readOnly = true)
public class ConditionServiceImpl implements ConditionService {

    private final ConditionDao conditionDao;

    public ConditionServiceImpl(ConditionDao conditionDao) {
        this.conditionDao = conditionDao;
    }

    @Override
    public PageResponse<Sensor> getSensorList(int page, int size, String keyword) {
        int pageNum = Paging.normalizePage(page);
        int pageSize = Paging.normalizeSize(size);
        List<Sensor> content = conditionDao.selectSensorList(Paging.offset(pageNum, pageSize), pageSize, keyword);
        long totalElements = conditionDao.selectSensorCount(keyword);
        return PageResponse.of(content, pageNum, pageSize, totalElements);
    }

    @Override
    public PageResponse<Regulator> getRegulatorList(int page, int size, String keyword) {
        int pageNum = Paging.normalizePage(page);
        int pageSize = Paging.normalizeSize(size);
        List<Regulator> content = conditionDao.selectRegulatorList(Paging.offset(pageNum, pageSize), pageSize, keyword);
        long totalElements = conditionDao.selectRegulatorCount(keyword);
        return PageResponse.of(content, pageNum, pageSize, totalElements);
    }

    @Override
    public PageResponse<OilAnalysis> getOilAnalysisList(int page, int size, String keyword) {
        int pageNum = Paging.normalizePage(page);
        int pageSize = Paging.normalizeSize(size);
        List<OilAnalysis> content = conditionDao.selectOilAnalysisList(Paging.offset(pageNum, pageSize), pageSize, keyword);
        long totalElements = conditionDao.selectOilAnalysisCount(keyword);
        return PageResponse.of(content, pageNum, pageSize, totalElements);
    }

    @Override
    public PageResponse<DailyCheck> getDailyCheckList(int page, int size, String keyword) {
        int pageNum = Paging.normalizePage(page);
        int pageSize = Paging.normalizeSize(size);
        List<DailyCheck> content = conditionDao.selectDailyCheckList(Paging.offset(pageNum, pageSize), pageSize, keyword);
        long totalElements = conditionDao.selectDailyCheckCount(keyword);
        return PageResponse.of(content, pageNum, pageSize, totalElements);
    }

    @Override
    public PageResponse<Standard> getStandardList(int page, int size, String keyword) {
        int pageNum = Paging.normalizePage(page);
        int pageSize = Paging.normalizeSize(size);
        List<Standard> content = conditionDao.selectStandardList(Paging.offset(pageNum, pageSize), pageSize, keyword);
        long totalElements = conditionDao.selectStandardCount(keyword);
        return PageResponse.of(content, pageNum, pageSize, totalElements);
    }

}
