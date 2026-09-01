package com.mes.dao.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.stereotype.Repository;

import com.mes.dao.ConditionDao;
import com.mes.domain.condition.Sensor;
import com.mes.domain.condition.Regulator;
import com.mes.domain.condition.RegulatorFile;
import com.mes.domain.condition.OilAnalysis;
import com.mes.domain.condition.DailyCheck;
import com.mes.domain.condition.Standard;

@Repository
public class ConditionDaoImpl implements ConditionDao {

    private final SqlSessionTemplate sqlSession;

    public ConditionDaoImpl(SqlSessionTemplate sqlSession) {
        this.sqlSession = sqlSession;
    }

    @Override
    public List<Sensor> selectSensorList(int year, String sensorType) {
        Map<String, Object> p = new HashMap<>();
        p.put("year", year);
        p.put("sensorType", sensorType);
        return sqlSession.selectList("SensorMapper.selectList", p);
    }

    @Override
    public void insertSensor(Sensor sensor) {
        sqlSession.insert("SensorMapper.insert", sensor);
    }

    @Override
    public void updateSensor(Sensor sensor) {
        sqlSession.update("SensorMapper.updateFull", sensor);
    }

    @Override
    public void softDeleteSensor(Long id) {
        sqlSession.update("SensorMapper.softDelete", id);
    }

    @Override
    public List<Regulator> selectRegulatorList(Integer calibYear, String equipName) {
        Map<String, Object> p = new HashMap<>();
        p.put("calibYear", calibYear);
        p.put("equipName", equipName);
        return sqlSession.selectList("RegulatorMapper.selectList", p);
    }

    @Override
    public List<String> selectRegulatorEquipNames() {
        return sqlSession.selectList("RegulatorMapper.selectEquipNames");
    }

    @Override
    public Regulator selectRegulatorById(Long id) {
        return sqlSession.selectOne("RegulatorMapper.selectById", id);
    }

    @Override
    public void insertRegulator(Regulator regulator) {
        sqlSession.insert("RegulatorMapper.insert", regulator);
    }

    @Override
    public void updateRegulatorMeta(Regulator regulator) {
        sqlSession.update("RegulatorMapper.updateMeta", regulator);
    }

    @Override
    public void softDeleteRegulator(Long id) {
        sqlSession.update("RegulatorMapper.softDelete", id);
    }

    @Override
    public List<RegulatorFile> selectRegulatorFilesByControllerId(Long controllerId) {
        return sqlSession.selectList("RegulatorMapper.selectFilesByControllerId", controllerId);
    }

    @Override
    public RegulatorFile selectRegulatorFileById(Long fileId) {
        return sqlSession.selectOne("RegulatorMapper.selectFileById", fileId);
    }

    @Override
    public void insertRegulatorFile(RegulatorFile file) {
        sqlSession.insert("RegulatorMapper.insertFile", file);
    }

    @Override
    public void deleteRegulatorFile(Long fileId) {
        sqlSession.delete("RegulatorMapper.deleteFile", fileId);
    }

    @Override
    public List<OilAnalysis> selectOilAnalysisList(String from, String to, String mchName) {
        Map<String, Object> p = new HashMap<>();
        p.put("from", from);
        p.put("to", to);
        p.put("mchName", mchName);
        return sqlSession.selectList("OilAnalysisMapper.selectList", p);
    }

    @Override
    public List<String> selectOilAnalysisMchNames() {
        return sqlSession.selectList("OilAnalysisMapper.selectMchNames");
    }

    @Override
    public OilAnalysis selectOilAnalysisById(Long id) {
        return sqlSession.selectOne("OilAnalysisMapper.selectById", id);
    }

    @Override
    public void insertOilAnalysis(OilAnalysis oilAnalysis) {
        sqlSession.insert("OilAnalysisMapper.insert", oilAnalysis);
    }

    @Override
    public void updateOilAnalysisMeta(OilAnalysis oilAnalysis) {
        sqlSession.update("OilAnalysisMapper.updateMeta", oilAnalysis);
    }

    @Override
    public void updateOilAnalysisBoxFile(Long id, String boxPrefix, String fileName, String origFileName, Long fileSize) {
        Map<String, Object> p = new HashMap<>();
        p.put("id", id);
        p.put("boxPrefix", boxPrefix);
        p.put("fileName", fileName);
        p.put("origFileName", origFileName);
        p.put("fileSize", fileSize);
        sqlSession.update("OilAnalysisMapper.updateBoxFile", p);
    }

    @Override
    public void softDeleteOilAnalysis(Long id) {
        sqlSession.update("OilAnalysisMapper.softDelete", id);
    }

    @Override
    public List<DailyCheck> selectDailyCheckByYm(String ym) {
        return sqlSession.selectList("DailyCheckMapper.selectByYm", ym);
    }

    @Override
    public long countDailyCheckByYm(String ym) {
        Long count = sqlSession.selectOne("DailyCheckMapper.countByYm", ym);
        return count == null ? 0L : count;
    }

    @Override
    public void seedDailyCheckMonth(String ym) {
        Map<String, Object> p = new HashMap<>();
        p.put("ym", ym);
        sqlSession.update("DailyCheckMapper.seedMonth", p);
    }

    @Override
    public void insertDailyCheckRow(String ym) {
        sqlSession.insert("DailyCheckMapper.insertBlankRow", ym);
    }

    @Override
    public void updateDailyCheckField(Long cnt, String dField, String dValue) {
        Map<String, Object> p = new HashMap<>();
        p.put("cnt", cnt);
        p.put("dField", dField);
        p.put("dValue", dValue);
        sqlSession.update("DailyCheckMapper.updateField", p);
    }

    @Override
    public void updateDailyCheckImage(Long cnt, String imgUrl) {
        Map<String, Object> p = new HashMap<>();
        p.put("cnt", cnt);
        p.put("imgUrl", imgUrl);
        sqlSession.update("DailyCheckMapper.updateImage", p);
    }

    @Override
    public void softDeleteDailyCheck(Long cnt) {
        sqlSession.update("DailyCheckMapper.softDelete", cnt);
    }

    @Override
    public List<Standard> selectStandardList(String category, String keyword) {
        Map<String, Object> p = new HashMap<>();
        p.put("category", category);
        p.put("keyword", keyword);
        return sqlSession.selectList("StandardMapper.selectList", p);
    }

    @Override
    public Standard selectStandardById(Long id) {
        return sqlSession.selectOne("StandardMapper.selectById", id);
    }

    @Override
    public void insertStandard(Standard standard) {
        sqlSession.insert("StandardMapper.insert", standard);
    }

    @Override
    public void updateStandardMeta(Standard standard) {
        sqlSession.update("StandardMapper.updateMeta", standard);
    }

    @Override
    public void updateStandardFile(Long id, String fileName, String origFileName, Long fileSize) {
        Map<String, Object> p = new HashMap<>();
        p.put("id", id);
        p.put("fileName", fileName);
        p.put("origFileName", origFileName);
        p.put("fileSize", fileSize);
        sqlSession.update("StandardMapper.updateFile", p);
    }

    @Override
    public void softDeleteStandard(Long id) {
        sqlSession.update("StandardMapper.softDelete", id);
    }
}
