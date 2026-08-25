package com.mes.dao.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.stereotype.Repository;

import com.mes.dao.ProductionDao;
import com.mes.domain.production.WorkOrder;
import com.mes.domain.production.ByItem;
import com.mes.domain.production.EquipEff;
import com.mes.domain.production.DailyReport;
import com.mes.domain.production.LotReport;

@Repository
public class ProductionDaoImpl implements ProductionDao {

    private final SqlSessionTemplate sqlSession;

    public ProductionDaoImpl(SqlSessionTemplate sqlSession) {
        this.sqlSession = sqlSession;
    }

    @Override
    public List<WorkOrder> selectWorkOrderList(int offset, int size, String keyword) {
        return sqlSession.selectList("WorkOrderMapper.selectList", params(offset, size, keyword));
    }

    @Override
    public long selectWorkOrderCount(String keyword) {
        Long count = sqlSession.selectOne("WorkOrderMapper.selectCount", params(0, 0, keyword));
        return count == null ? 0L : count;
    }

    @Override
    public List<ByItem> selectByItemList(int offset, int size, String keyword) {
        return sqlSession.selectList("ByItemMapper.selectList", params(offset, size, keyword));
    }

    @Override
    public long selectByItemCount(String keyword) {
        Long count = sqlSession.selectOne("ByItemMapper.selectCount", params(0, 0, keyword));
        return count == null ? 0L : count;
    }

    @Override
    public List<EquipEff> selectEquipEffList(int offset, int size, String keyword) {
        return sqlSession.selectList("EquipEffMapper.selectList", params(offset, size, keyword));
    }

    @Override
    public long selectEquipEffCount(String keyword) {
        Long count = sqlSession.selectOne("EquipEffMapper.selectCount", params(0, 0, keyword));
        return count == null ? 0L : count;
    }

    @Override
    public List<DailyReport> selectDailyReportList(int offset, int size, String keyword) {
        return sqlSession.selectList("DailyReportMapper.selectList", params(offset, size, keyword));
    }

    @Override
    public long selectDailyReportCount(String keyword) {
        Long count = sqlSession.selectOne("DailyReportMapper.selectCount", params(0, 0, keyword));
        return count == null ? 0L : count;
    }

    @Override
    public List<LotReport> selectLotReportList(int offset, int size, String keyword) {
        return sqlSession.selectList("LotReportMapper.selectList", params(offset, size, keyword));
    }

    @Override
    public long selectLotReportCount(String keyword) {
        Long count = sqlSession.selectOne("LotReportMapper.selectCount", params(0, 0, keyword));
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
