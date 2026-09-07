package com.mes.service;

import java.util.List;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import com.mes.common.response.PageResponse;
import com.mes.domain.quality.Cpk;
import com.mes.domain.quality.Ppk;
import com.mes.domain.quality.Fproof;
import com.mes.domain.quality.TempUniform;
import com.mes.domain.quality.Hardness;
import com.mes.domain.quality.Nonconform;

public interface QualityService {

    PageResponse<Cpk> getCpkList(int page, int size, String keyword);

    PageResponse<Ppk> getPpkList(int page, int size, String keyword);

    PageResponse<Fproof> getFproofList(int page, int size, String keyword);

    List<TempUniform> getTempUniformList(String equipName, String judgment, String from, String to);

    List<String> getTempUniformEquipNames();

    TempUniform getTempUniformById(Long id);

    TempUniform createTempUniform(TempUniform tempUniform, MultipartFile file);

    TempUniform updateTempUniform(Long id, TempUniform tempUniform, MultipartFile file);

    void deleteTempUniform(Long id);

    Resource loadTempUniformFile(String fileName);

    PageResponse<Hardness> getHardnessList(int page, int size, String keyword);

    PageResponse<Nonconform> getNonconformList(int page, int size, String keyword);

}
