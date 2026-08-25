package com.mes.dao.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.stereotype.Repository;

import com.mes.dao.MonitoringDao;
import com.mes.domain.monitoring.ProdStatus;
import com.mes.domain.monitoring.Integrated;
import com.mes.domain.monitoring.Alarm;
import com.mes.domain.monitoring.AlarmRank;
import com.mes.domain.monitoring.Trend;
import com.mes.domain.monitoring.LotStatus;
import com.mes.domain.monitoring.LotTracking;

@Repository
public class MonitoringDaoImpl implements MonitoringDao {

    private final SqlSessionTemplate sqlSession;

    public MonitoringDaoImpl(SqlSessionTemplate sqlSession) {
        this.sqlSession = sqlSession;
    }

    @Override
    public List<ProdStatus> selectProdStatusList(int offset, int size, String keyword) {
        return sqlSession.selectList("ProdStatusMapper.selectList", params(offset, size, keyword));
    }

    @Override
    public long selectProdStatusCount(String keyword) {
        Long count = sqlSession.selectOne("ProdStatusMapper.selectCount", params(0, 0, keyword));
        return count == null ? 0L : count;
    }

    @Override
    public List<Integrated> selectIntegratedList(int offset, int size, String keyword) {
        return sqlSession.selectList("IntegratedMapper.selectList", params(offset, size, keyword));
    }

    @Override
    public long selectIntegratedCount(String keyword) {
        Long count = sqlSession.selectOne("IntegratedMapper.selectCount", params(0, 0, keyword));
        return count == null ? 0L : count;
    }

    @Override
    public List<Alarm> selectAlarmList(int offset, int size, String keyword) {
        return sqlSession.selectList("AlarmMapper.selectList", params(offset, size, keyword));
    }

    @Override
    public long selectAlarmCount(String keyword) {
        Long count = sqlSession.selectOne("AlarmMapper.selectCount", params(0, 0, keyword));
        return count == null ? 0L : count;
    }

    @Override
    public List<AlarmRank> selectAlarmRankList(int offset, int size, String keyword) {
        return sqlSession.selectList("AlarmRankMapper.selectList", params(offset, size, keyword));
    }

    @Override
    public long selectAlarmRankCount(String keyword) {
        Long count = sqlSession.selectOne("AlarmRankMapper.selectCount", params(0, 0, keyword));
        return count == null ? 0L : count;
    }

    @Override
    public List<Trend> selectTrendList(int offset, int size, String keyword) {
        return sqlSession.selectList("TrendMapper.selectList", params(offset, size, keyword));
    }

    @Override
    public long selectTrendCount(String keyword) {
        Long count = sqlSession.selectOne("TrendMapper.selectCount", params(0, 0, keyword));
        return count == null ? 0L : count;
    }

    @Override
    public List<LotStatus> selectLotStatusList(int offset, int size, String keyword) {
        return sqlSession.selectList("LotStatusMapper.selectList", params(offset, size, keyword));
    }

    @Override
    public long selectLotStatusCount(String keyword) {
        Long count = sqlSession.selectOne("LotStatusMapper.selectCount", params(0, 0, keyword));
        return count == null ? 0L : count;
    }

    @Override
    public List<LotTracking> selectLotTrackingList(int offset, int size, String keyword) {
        return sqlSession.selectList("LotTrackingMapper.selectList", params(offset, size, keyword));
    }

    @Override
    public long selectLotTrackingCount(String keyword) {
        Long count = sqlSession.selectOne("LotTrackingMapper.selectCount", params(0, 0, keyword));
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
