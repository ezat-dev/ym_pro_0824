package com.mes.dao.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.stereotype.Repository;

import com.mes.dao.ConditionDao;
import com.mes.domain.condition.Sensor;
import com.mes.domain.condition.Regulator;
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
    public List<Sensor> selectSensorList(int offset, int size, String keyword) {
        return sqlSession.selectList("SensorMapper.selectList", params(offset, size, keyword));
    }

    @Override
    public long selectSensorCount(String keyword) {
        Long count = sqlSession.selectOne("SensorMapper.selectCount", params(0, 0, keyword));
        return count == null ? 0L : count;
    }

    @Override
    public List<Regulator> selectRegulatorList(int offset, int size, String keyword) {
        return sqlSession.selectList("RegulatorMapper.selectList", params(offset, size, keyword));
    }

    @Override
    public long selectRegulatorCount(String keyword) {
        Long count = sqlSession.selectOne("RegulatorMapper.selectCount", params(0, 0, keyword));
        return count == null ? 0L : count;
    }

    @Override
    public List<OilAnalysis> selectOilAnalysisList(int offset, int size, String keyword) {
        return sqlSession.selectList("OilAnalysisMapper.selectList", params(offset, size, keyword));
    }

    @Override
    public long selectOilAnalysisCount(String keyword) {
        Long count = sqlSession.selectOne("OilAnalysisMapper.selectCount", params(0, 0, keyword));
        return count == null ? 0L : count;
    }

    @Override
    public List<DailyCheck> selectDailyCheckList(int offset, int size, String keyword) {
        return sqlSession.selectList("DailyCheckMapper.selectList", params(offset, size, keyword));
    }

    @Override
    public long selectDailyCheckCount(String keyword) {
        Long count = sqlSession.selectOne("DailyCheckMapper.selectCount", params(0, 0, keyword));
        return count == null ? 0L : count;
    }

    @Override
    public List<Standard> selectStandardList(int offset, int size, String keyword) {
        return sqlSession.selectList("StandardMapper.selectList", params(offset, size, keyword));
    }

    @Override
    public long selectStandardCount(String keyword) {
        Long count = sqlSession.selectOne("StandardMapper.selectCount", params(0, 0, keyword));
        return count == null ? 0L : count;
    }

    private Map<String, Object> params(int offset, int size, String keyword) {
        Map<String, Object> p = new HashMap<>();
        p.put("offset", offset);
        p.put("size", size);
        p.put("keyword", keyword);
        return p;
    }
}
