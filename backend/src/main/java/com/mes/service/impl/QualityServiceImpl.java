package com.mes.service.impl;

import java.io.IOException;
import java.math.BigDecimal;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.mes.common.exception.BusinessException;
import com.mes.common.exception.ErrorCode;
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

    @Value("${app.tempUniform-upload-dir}")
    private String tempUniformUploadDir;

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
    public List<TempUniform> getTempUniformList(String equipName, String judgment, String from, String to) {
        return qualityDao.selectTempUniformList(equipName, judgment, from, to);
    }

    @Override
    public List<String> getTempUniformEquipNames() {
        return qualityDao.selectTempUniformEquipNames();
    }

    @Override
    public TempUniform getTempUniformById(Long id) {
        TempUniform found = qualityDao.selectTempUniformById(id);
        if (found == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "온도균일성보고서 정보를 찾을 수 없습니다.");
        }
        return found;
    }

    @Override
    @Transactional
    public TempUniform createTempUniform(TempUniform tempUniform, MultipartFile file) {
        validateTempUniformMeta(tempUniform);
        applyJudgment(tempUniform);
        qualityDao.insertTempUniform(tempUniform);
        storeTempUniformFile(tempUniform.getId(), file);
        return getTempUniformById(tempUniform.getId());
    }

    @Override
    @Transactional
    public TempUniform updateTempUniform(Long id, TempUniform tempUniform, MultipartFile file) {
        validateTempUniformMeta(tempUniform);
        applyJudgment(tempUniform);
        tempUniform.setId(id);
        qualityDao.updateTempUniform(tempUniform);
        if (file != null && !file.isEmpty()) {
            TempUniform existing = getTempUniformById(id);
            storeTempUniformFile(id, file);
            if (existing.getFileName() != null && !existing.getFileName().isBlank()) {
                try {
                    Files.deleteIfExists(Paths.get(tempUniformUploadDir).resolve(existing.getFileName()));
                } catch (IOException ignored) {
                    // 이전 파일 삭제 실패는 수정 자체를 막을 이유가 아니므로 무시한다.
                }
            }
        }
        return getTempUniformById(id);
    }

    @Override
    @Transactional
    public void deleteTempUniform(Long id) {
        qualityDao.softDeleteTempUniform(id);
    }

    @Override
    public Resource loadTempUniformFile(String fileName) {
        try {
            Path target = Paths.get(tempUniformUploadDir).resolve(fileName);
            if (!Files.exists(target)) {
                throw new BusinessException(ErrorCode.NOT_FOUND, "파일을 찾을 수 없습니다.");
            }
            return new UrlResource(target.toUri());
        } catch (MalformedURLException e) {
            throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR, "파일 경로가 올바르지 않습니다.");
        }
    }

    private void validateTempUniformMeta(TempUniform t) {
        if (t.getEquipName() == null || t.getEquipName().isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_PARAMETER, "설비명을 입력해주세요.");
        }
        if (t.getSurveyDate() == null || t.getSurveyDate().isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_PARAMETER, "조사일자를 입력해주세요.");
        }
    }

    /** 편차/판정은 클라이언트 입력을 신뢰하지 않고 항상 서버에서 다시 계산한다. */
    private void applyJudgment(TempUniform t) {
        BigDecimal set = t.getSetTemp() == null ? BigDecimal.ZERO : t.getSetTemp();
        BigDecimal max = t.getMaxTemp() == null ? BigDecimal.ZERO : t.getMaxTemp();
        BigDecimal min = t.getMinTemp() == null ? BigDecimal.ZERO : t.getMinTemp();
        BigDecimal tol = t.getTolerance() == null ? BigDecimal.ZERO : t.getTolerance();
        BigDecimal devHigh = max.subtract(set).abs();
        BigDecimal devLow = min.subtract(set).abs();
        BigDecimal deviation = devHigh.max(devLow);
        t.setDeviation(deviation);
        t.setJudgment(deviation.compareTo(tol) <= 0 ? "합격" : "불합격");
    }

    private void storeTempUniformFile(Long id, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return;
        }
        String original = file.getOriginalFilename() == null ? "" : file.getOriginalFilename();
        if (!original.toLowerCase().endsWith(".pdf")) {
            throw new BusinessException(ErrorCode.INVALID_PARAMETER, "업로드 파일은 PDF 형식만 가능합니다: " + original);
        }
        String ext = original.contains(".") ? original.substring(original.lastIndexOf('.')) : "";
        String newFileName = id + "_" + System.currentTimeMillis() + ext;
        try {
            Path dir = Paths.get(tempUniformUploadDir);
            Files.createDirectories(dir);
            file.transferTo(dir.resolve(newFileName));
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR, "파일 저장에 실패했습니다.");
        }
        qualityDao.updateTempUniformFile(id, newFileName, original, file.getSize());
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
