package com.mes.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mes.common.response.PageResponse;
import com.mes.common.util.Paging;
import com.mes.dao.QualityDao;
import com.mes.domain.quality.Cpk;
import com.mes.domain.quality.Ppk;
import com.mes.domain.quality.Fproof;
import com.mes.domain.quality.TempUniform;
import com.mes.domain.quality.Hardness;
import com.mes.domain.quality.Nonconform;
import com.mes.service.QualityService;

@Service
@Transactional(readOnly = true)
public class QualityServiceImpl implements QualityService {

    private final QualityDao qualityDao;

    public QualityServiceImpl(QualityDao qualityDao) {
        this.qualityDao = qualityDao;
    }

    @Override
    public PageResponse<Cpk> getCpkList(int page, int size, String keyword) {
        int pageNum = Paging.normalizePage(page);
        int pageSize = Paging.normalizeSize(size);
        List<Cpk> content = qualityDao.selectCpkList(Paging.offset(pageNum, pageSize), pageSize, keyword);
        long totalElements = qualityDao.selectCpkCount(keyword);
        return PageResponse.of(content, pageNum, pageSize, totalElements);
    }

    @Override
    public PageResponse<Ppk> getPpkList(int page, int size, String keyword) {
        int pageNum = Paging.normalizePage(page);
        int pageSize = Paging.normalizeSize(size);
        List<Ppk> content = qualityDao.selectPpkList(Paging.offset(pageNum, pageSize), pageSize, keyword);
        long totalElements = qualityDao.selectPpkCount(keyword);
        return PageResponse.of(content, pageNum, pageSize, totalElements);
    }

    @Override
    public PageResponse<Fproof> getFproofList(int page, int size, String keyword) {
        int pageNum = Paging.normalizePage(page);
        int pageSize = Paging.normalizeSize(size);
        List<Fproof> content = qualityDao.selectFproofList(Paging.offset(pageNum, pageSize), pageSize, keyword);
        long totalElements = qualityDao.selectFproofCount(keyword);
        return PageResponse.of(content, pageNum, pageSize, totalElements);
    }

    @Override
    public PageResponse<TempUniform> getTempUniformList(int page, int size, String keyword) {
        int pageNum = Paging.normalizePage(page);
        int pageSize = Paging.normalizeSize(size);
        List<TempUniform> content = qualityDao.selectTempUniformList(Paging.offset(pageNum, pageSize), pageSize, keyword);
        long totalElements = qualityDao.selectTempUniformCount(keyword);
        return PageResponse.of(content, pageNum, pageSize, totalElements);
    }

    @Override
    public PageResponse<Hardness> getHardnessList(int page, int size, String keyword) {
        int pageNum = Paging.normalizePage(page);
        int pageSize = Paging.normalizeSize(size);
        List<Hardness> content = qualityDao.selectHardnessList(Paging.offset(pageNum, pageSize), pageSize, keyword);
        long totalElements = qualityDao.selectHardnessCount(keyword);
        return PageResponse.of(content, pageNum, pageSize, totalElements);
    }

    @Override
    public PageResponse<Nonconform> getNonconformList(int page, int size, String keyword) {
        int pageNum = Paging.normalizePage(page);
        int pageSize = Paging.normalizeSize(size);
        List<Nonconform> content = qualityDao.selectNonconformList(Paging.offset(pageNum, pageSize), pageSize, keyword);
        long totalElements = qualityDao.selectNonconformCount(keyword);
        return PageResponse.of(content, pageNum, pageSize, totalElements);
    }

}
