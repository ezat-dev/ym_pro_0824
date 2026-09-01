package com.mes.service;

import java.util.List;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import com.mes.domain.condition.Sensor;
import com.mes.domain.condition.Regulator;
import com.mes.domain.condition.RegulatorFile;
import com.mes.domain.condition.OilAnalysis;
import com.mes.domain.condition.DailyCheck;
import com.mes.domain.condition.Standard;

public interface ConditionService {

    List<Sensor> getSensorList(int year, String sensorType);

    void createSensor(Sensor sensor);

    void updateSensor(Sensor sensor);

    void deleteSensors(List<Long> ids);

    List<Regulator> getRegulatorList(int calibYear, String equipName);

    List<String> getRegulatorEquipNames();

    Regulator getRegulatorById(Long id);

    Regulator createRegulator(Regulator meta, MultipartFile[] h1Files, MultipartFile[] h2Files);

    Regulator updateRegulator(Long id, Regulator meta, List<Long> keepFileIds,
            MultipartFile[] h1Files, MultipartFile[] h2Files);

    void deleteRegulators(List<Long> ids);

    RegulatorFile getRegulatorFileMeta(Long fileId);

    Resource loadRegulatorFile(String fileName);

    List<OilAnalysis> getOilAnalysisList(String from, String to, String mchName);

    List<String> getOilAnalysisMchNames();

    OilAnalysis getOilAnalysisById(Long id);

    OilAnalysis createOilAnalysis(OilAnalysis meta, MultipartFile box1, MultipartFile box2,
            MultipartFile box3, MultipartFile box4);

    OilAnalysis updateOilAnalysis(Long id, OilAnalysis meta, MultipartFile box1, MultipartFile box2,
            MultipartFile box3, MultipartFile box4);

    void deleteOilAnalysis(Long id);

    Resource loadOilAnalysisFile(String fileName);

    /** 해당 월(ym) 데이터가 없으면 고정 항목을 자동 시딩한 뒤 목록을 반환한다. */
    List<DailyCheck> getDailyCheckByYm(String ym);

    void updateDailyCheckField(Long cnt, String dField, String dValue);

    void insertDailyCheckRow(String ym);

    void deleteDailyCheckRow(Long cnt);

    String saveDailyCheckImage(Long cnt, MultipartFile file);

    Resource loadDailyCheckImage(String fileName);

    List<Standard> getStandardList(String category, String keyword);

    Standard getStandardById(Long id);

    Standard createStandard(Standard meta, MultipartFile file);

    void updateStandardMeta(Long id, Standard meta);

    void updateStandardFile(Long id, MultipartFile file);

    void deleteStandard(Long id);

    Resource loadStandardFile(String fileName);

}
