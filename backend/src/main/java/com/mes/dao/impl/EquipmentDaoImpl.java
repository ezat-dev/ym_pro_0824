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
import com.mes.domain.equipment.SparePartHistory;

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
    public List<SparePart> selectSparePartList(String equipName, String keyword) {
        Map<String, Object> p = new HashMap<>();
        p.put("equipName", equipName);
        p.put("keyword", keyword);
        return sqlSession.selectList("SparePartMapper.selectList", p);
    }

    @Override
    public List<String> selectSparePartEquipNames() {
        return sqlSession.selectList("SparePartMapper.selectEquipNames");
    }

    @Override
    public SparePart selectSparePartById(Long id) {
        return sqlSession.selectOne("SparePartMapper.selectById", id);
    }

    @Override
    public void insertSparePart(SparePart sparePart) {
        sqlSession.insert("SparePartMapper.insert", sparePart);
    }

    @Override
    public void updateSparePart(SparePart sparePart) {
        sqlSession.update("SparePartMapper.update", sparePart);
    }

    @Override
    public void softDeleteSparePart(Long id) {
        sqlSession.update("SparePartMapper.softDelete", id);
    }

    @Override
    public List<SparePartHistory> selectSparePartHistoryList(Long partId, String type, String from, String to) {
        Map<String, Object> p = new HashMap<>();
        p.put("partId", partId);
        p.put("type", type);
        p.put("from", from);
        p.put("to", to);
        return sqlSession.selectList("SparePartMapper.selectHistoryList", p);
    }

    @Override
    public void insertSparePartHistory(SparePartHistory history) {
        sqlSession.insert("SparePartMapper.insertHistory", history);
    }

    @Override
    public void deleteSparePartHistory(Long id) {
        sqlSession.delete("SparePartMapper.deleteHistory", id);
    }

    private Map<String, Object> params(int offset, int size, String keyword) {
        Map<String, Object> p = new HashMap<>();
        p.put("offset", offset);
        p.put("size", size);
        p.put("keyword", keyword);
        return p;
    }
}
