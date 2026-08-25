package com.mes.dao.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.stereotype.Repository;

import com.mes.dao.EquipmentDao;
import com.mes.domain.equipment.DownStatus;
import com.mes.domain.equipment.UtilRate;
import com.mes.domain.equipment.PowerUsage;
import com.mes.domain.equipment.History;
import com.mes.domain.equipment.RepairHist;
import com.mes.domain.equipment.SparePart;

@Repository
public class EquipmentDaoImpl implements EquipmentDao {

    private final SqlSessionTemplate sqlSession;

    public EquipmentDaoImpl(SqlSessionTemplate sqlSession) {
        this.sqlSession = sqlSession;
    }

    @Override
    public List<DownStatus> selectDownStatusList(int offset, int size, String keyword) {
        return sqlSession.selectList("DownStatusMapper.selectList", params(offset, size, keyword));
    }

    @Override
    public long selectDownStatusCount(String keyword) {
        Long count = sqlSession.selectOne("DownStatusMapper.selectCount", params(0, 0, keyword));
        return count == null ? 0L : count;
    }

    @Override
    public List<UtilRate> selectUtilRateList(int offset, int size, String keyword) {
        return sqlSession.selectList("UtilRateMapper.selectList", params(offset, size, keyword));
    }

    @Override
    public long selectUtilRateCount(String keyword) {
        Long count = sqlSession.selectOne("UtilRateMapper.selectCount", params(0, 0, keyword));
        return count == null ? 0L : count;
    }

    @Override
    public List<PowerUsage> selectPowerUsageList(int offset, int size, String keyword) {
        return sqlSession.selectList("PowerUsageMapper.selectList", params(offset, size, keyword));
    }

    @Override
    public long selectPowerUsageCount(String keyword) {
        Long count = sqlSession.selectOne("PowerUsageMapper.selectCount", params(0, 0, keyword));
        return count == null ? 0L : count;
    }

    @Override
    public List<History> selectHistoryList(int offset, int size, String keyword) {
        return sqlSession.selectList("HistoryMapper.selectList", params(offset, size, keyword));
    }

    @Override
    public long selectHistoryCount(String keyword) {
        Long count = sqlSession.selectOne("HistoryMapper.selectCount", params(0, 0, keyword));
        return count == null ? 0L : count;
    }

    @Override
    public List<RepairHist> selectRepairHistList(int offset, int size, String keyword) {
        return sqlSession.selectList("RepairHistMapper.selectList", params(offset, size, keyword));
    }

    @Override
    public long selectRepairHistCount(String keyword) {
        Long count = sqlSession.selectOne("RepairHistMapper.selectCount", params(0, 0, keyword));
        return count == null ? 0L : count;
    }

    @Override
    public List<SparePart> selectSparePartList(int offset, int size, String keyword) {
        return sqlSession.selectList("SparePartMapper.selectList", params(offset, size, keyword));
    }

    @Override
    public long selectSparePartCount(String keyword) {
        Long count = sqlSession.selectOne("SparePartMapper.selectCount", params(0, 0, keyword));
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
