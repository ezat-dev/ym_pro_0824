package com.mes.dao.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.stereotype.Repository;

import com.mes.dao.QualityDao;
import com.mes.domain.quality.Cpk;
import com.mes.domain.quality.Ppk;
import com.mes.domain.quality.Fproof;
import com.mes.domain.quality.TempUniform;
import com.mes.domain.quality.Hardness;
import com.mes.domain.quality.Nonconform;

@Repository
public class QualityDaoImpl implements QualityDao {

    private final SqlSessionTemplate sqlSession;

    public QualityDaoImpl(SqlSessionTemplate sqlSession) {
        this.sqlSession = sqlSession;
    }

    @Override
    public List<Cpk> selectCpkList(int offset, int size, String keyword) {
        return sqlSession.selectList("CpkMapper.selectList", params(offset, size, keyword));
    }

    @Override
    public long selectCpkCount(String keyword) {
        Long count = sqlSession.selectOne("CpkMapper.selectCount", params(0, 0, keyword));
        return count == null ? 0L : count;
    }

    @Override
    public List<Ppk> selectPpkList(int offset, int size, String keyword) {
        return sqlSession.selectList("PpkMapper.selectList", params(offset, size, keyword));
    }

    @Override
    public long selectPpkCount(String keyword) {
        Long count = sqlSession.selectOne("PpkMapper.selectCount", params(0, 0, keyword));
        return count == null ? 0L : count;
    }

    @Override
    public List<Fproof> selectFproofList(int offset, int size, String keyword) {
        return sqlSession.selectList("FproofMapper.selectList", params(offset, size, keyword));
    }

    @Override
    public long selectFproofCount(String keyword) {
        Long count = sqlSession.selectOne("FproofMapper.selectCount", params(0, 0, keyword));
        return count == null ? 0L : count;
    }

    @Override
    public List<TempUniform> selectTempUniformList(int offset, int size, String keyword) {
        return sqlSession.selectList("TempUniformMapper.selectList", params(offset, size, keyword));
    }

    @Override
    public long selectTempUniformCount(String keyword) {
        Long count = sqlSession.selectOne("TempUniformMapper.selectCount", params(0, 0, keyword));
        return count == null ? 0L : count;
    }

    @Override
    public List<Hardness> selectHardnessList(int offset, int size, String keyword) {
        return sqlSession.selectList("HardnessMapper.selectList", params(offset, size, keyword));
    }

    @Override
    public long selectHardnessCount(String keyword) {
        Long count = sqlSession.selectOne("HardnessMapper.selectCount", params(0, 0, keyword));
        return count == null ? 0L : count;
    }

    @Override
    public List<Nonconform> selectNonconformList(int offset, int size, String keyword) {
        return sqlSession.selectList("NonconformMapper.selectList", params(offset, size, keyword));
    }

    @Override
    public long selectNonconformCount(String keyword) {
        Long count = sqlSession.selectOne("NonconformMapper.selectCount", params(0, 0, keyword));
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
