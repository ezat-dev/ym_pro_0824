package com.mes.dao.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.stereotype.Repository;

import com.mes.dao.BaseDao;
import com.mes.domain.base.Auth;
import com.mes.domain.base.AuthMenuItem;
import com.mes.domain.base.LoginHist;
import com.mes.domain.base.Pattern;
import com.mes.domain.base.Product;
import com.mes.domain.base.User;
import com.mes.domain.base.Vendor;

@Repository
public class BaseDaoImpl implements BaseDao {

    private final SqlSessionTemplate sqlSession;

    public BaseDaoImpl(SqlSessionTemplate sqlSession) {
        this.sqlSession = sqlSession;
    }

    @Override
    public List<User> selectUserList(int offset, int size, String keyword) {
        return sqlSession.selectList("UserMapper.selectList", params(offset, size, keyword));
    }

    @Override
    public long selectUserCount(String keyword) {
        Long count = sqlSession.selectOne("UserMapper.selectCount", params(0, 0, keyword));
        return count == null ? 0L : count;
    }

    @Override
    public User selectUserById(Long userId) {
        return sqlSession.selectOne("UserMapper.selectById", userId);
    }

    @Override
    public User selectUserByLoginId(String loginId) {
        return sqlSession.selectOne("UserMapper.selectByLoginId", loginId);
    }

    @Override
    public void insertUser(User user) {
        sqlSession.insert("UserMapper.insert", user);
    }

    @Override
    public void updateUser(User user) {
        sqlSession.update("UserMapper.update", user);
    }

    @Override
    public void deleteUser(Long userId) {
        sqlSession.delete("UserMapper.delete", userId);
    }

    @Override
    public List<Vendor> selectVendorList(int offset, int size, String keyword) {
        return sqlSession.selectList("VendorMapper.selectList", params(offset, size, keyword));
    }

    @Override
    public long selectVendorCount(String keyword) {
        Long count = sqlSession.selectOne("VendorMapper.selectCount", params(0, 0, keyword));
        return count == null ? 0L : count;
    }

    @Override
    public List<Product> selectProductList(int offset, int size, String keyword) {
        return sqlSession.selectList("ProductMapper.selectList", params(offset, size, keyword));
    }

    @Override
    public long selectProductCount(String keyword) {
        Long count = sqlSession.selectOne("ProductMapper.selectCount", params(0, 0, keyword));
        return count == null ? 0L : count;
    }

    @Override
    public List<Pattern> selectPatternList(int offset, int size, String keyword) {
        return sqlSession.selectList("PatternMapper.selectList", params(offset, size, keyword));
    }

    @Override
    public long selectPatternCount(String keyword) {
        Long count = sqlSession.selectOne("PatternMapper.selectCount", params(0, 0, keyword));
        return count == null ? 0L : count;
    }

    @Override
    public List<Auth> selectAuthByUserId(Long userId) {
        return sqlSession.selectList("AuthMapper.selectByUserId", userId);
    }

    @Override
    public void deleteAuthByUserId(Long userId) {
        sqlSession.delete("AuthMapper.deleteByUserId", userId);
    }

    @Override
    public void insertAuthList(Long userId, List<AuthMenuItem> items) {
        if (items == null || items.isEmpty()) {
            return;
        }
        Map<String, Object> p = new HashMap<>();
        p.put("userId", userId);
        p.put("items", items);
        sqlSession.insert("AuthMapper.insertBatch", p);
    }

    @Override
    public List<LoginHist> selectLoginHistList(int offset, int size, String keyword) {
        return sqlSession.selectList("LoginHistMapper.selectList", params(offset, size, keyword));
    }

    @Override
    public long selectLoginHistCount(String keyword) {
        Long count = sqlSession.selectOne("LoginHistMapper.selectCount", params(0, 0, keyword));
        return count == null ? 0L : count;
    }

    @Override
    public void insertLoginHist(LoginHist loginHist) {
        sqlSession.insert("LoginHistMapper.insert", loginHist);
    }

    private Map<String, Object> params(int offset, int size, String keyword) {
        Map<String, Object> p = new HashMap<>();
        p.put("offset", offset);
        p.put("size", size);
        p.put("keyword", keyword);
        return p;
    }
}
