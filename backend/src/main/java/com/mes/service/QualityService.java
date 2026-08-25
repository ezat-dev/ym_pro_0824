package com.mes.service;

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

    PageResponse<TempUniform> getTempUniformList(int page, int size, String keyword);

    PageResponse<Hardness> getHardnessList(int page, int size, String keyword);

    PageResponse<Nonconform> getNonconformList(int page, int size, String keyword);

}
