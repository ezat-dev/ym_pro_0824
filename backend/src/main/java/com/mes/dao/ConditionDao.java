package com.mes.dao;

import java.util.List;

import com.mes.domain.condition.Sensor;
import com.mes.domain.condition.Regulator;
import com.mes.domain.condition.RegulatorFile;
import com.mes.domain.condition.OilAnalysis;
import com.mes.domain.condition.DailyCheck;
import com.mes.domain.condition.Standard;

/**
 * 조건관리 전체 메뉴의 데이터 접근 계약.
 */
public interface ConditionDao {

    List<Sensor> selectSensorList(int year, String sensorType);

    void insertSensor(Sensor sensor);

    void updateSensor(Sensor sensor);

    void softDeleteSensor(Long id);

    List<Regulator> selectRegulatorList(Integer calibYear, String equipName);

    List<String> selectRegulatorEquipNames();

    Regulator selectRegulatorById(Long id);

    void insertRegulator(Regulator regulator);

    void updateRegulatorMeta(Regulator regulator);

    void softDeleteRegulator(Long id);

    List<RegulatorFile> selectRegulatorFilesByControllerId(Long controllerId);

    RegulatorFile selectRegulatorFileById(Long fileId);

    void insertRegulatorFile(RegulatorFile file);

    void deleteRegulatorFile(Long fileId);

    List<OilAnalysis> selectOilAnalysisList(String from, String to, String mchName);

    List<String> selectOilAnalysisMchNames();

    OilAnalysis selectOilAnalysisById(Long id);

    void insertOilAnalysis(OilAnalysis oilAnalysis);

    void updateOilAnalysisMeta(OilAnalysis oilAnalysis);

    void updateOilAnalysisBoxFile(Long id, String boxPrefix, String fileName, String origFileName, Long fileSize);

    void softDeleteOilAnalysis(Long id);

    List<DailyCheck> selectDailyCheckByYm(String ym);

    long countDailyCheckByYm(String ym);

    void seedDailyCheckMonth(String ym);

    void insertDailyCheckRow(String ym);

    void updateDailyCheckField(Long cnt, String dField, String dValue);

    void updateDailyCheckImage(Long cnt, String imgUrl);

    void softDeleteDailyCheck(Long cnt);

    List<Standard> selectStandardList(String category, String keyword);

    Standard selectStandardById(Long id);

    void insertStandard(Standard standard);

    void updateStandardMeta(Standard standard);

    void updateStandardFile(Long id, String fileName, String origFileName, Long fileSize);

    void softDeleteStandard(Long id);

}
