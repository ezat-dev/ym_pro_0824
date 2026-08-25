package com.mes.dao;

import java.util.List;

import com.mes.domain.condition.Sensor;
import com.mes.domain.condition.Regulator;
import com.mes.domain.condition.OilAnalysis;
import com.mes.domain.condition.DailyCheck;
import com.mes.domain.condition.Standard;

/**
 * 조건관리 전체 메뉴의 데이터 접근 계약.
 */
public interface ConditionDao {

    List<Sensor> selectSensorList(int offset, int size, String keyword);

    long selectSensorCount(String keyword);

    List<Regulator> selectRegulatorList(int offset, int size, String keyword);

    long selectRegulatorCount(String keyword);

    List<OilAnalysis> selectOilAnalysisList(int offset, int size, String keyword);

    long selectOilAnalysisCount(String keyword);

    List<DailyCheck> selectDailyCheckList(int offset, int size, String keyword);

    long selectDailyCheckCount(String keyword);

    List<Standard> selectStandardList(int offset, int size, String keyword);

    long selectStandardCount(String keyword);

}
