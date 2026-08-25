package com.mes.service;

import com.mes.common.response.PageResponse;
import com.mes.domain.condition.Sensor;
import com.mes.domain.condition.Regulator;
import com.mes.domain.condition.OilAnalysis;
import com.mes.domain.condition.DailyCheck;
import com.mes.domain.condition.Standard;

public interface ConditionService {

    PageResponse<Sensor> getSensorList(int page, int size, String keyword);

    PageResponse<Regulator> getRegulatorList(int page, int size, String keyword);

    PageResponse<OilAnalysis> getOilAnalysisList(int page, int size, String keyword);

    PageResponse<DailyCheck> getDailyCheckList(int page, int size, String keyword);

    PageResponse<Standard> getStandardList(int page, int size, String keyword);

}
