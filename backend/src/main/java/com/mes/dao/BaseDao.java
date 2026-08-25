package com.mes.dao;

import java.util.List;

import com.mes.domain.base.Auth;
import com.mes.domain.base.AuthMenuItem;
import com.mes.domain.base.LoginHist;
import com.mes.domain.base.Pattern;
import com.mes.domain.base.Product;
import com.mes.domain.base.User;
import com.mes.domain.base.Vendor;

/**
 * 기준정보 전체 메뉴의 데이터 접근 계약.
 */
public interface BaseDao {

    List<User> selectUserList(int offset, int size, String keyword);

    long selectUserCount(String keyword);

    User selectUserById(Long userId);

    User selectUserByLoginId(String loginId);

    void insertUser(User user);

    void updateUser(User user);

    void deleteUser(Long userId);

    List<Vendor> selectVendorList(int offset, int size, String keyword);

    long selectVendorCount(String keyword);

    List<Product> selectProductList(int offset, int size, String keyword);

    long selectProductCount(String keyword);

    List<Pattern> selectPatternList(int offset, int size, String keyword);

    long selectPatternCount(String keyword);

    List<Auth> selectAuthByUserId(Long userId);

    void deleteAuthByUserId(Long userId);

    void insertAuthList(Long userId, List<AuthMenuItem> items);

    List<LoginHist> selectLoginHistList(int offset, int size, String keyword);

    long selectLoginHistCount(String keyword);

    void insertLoginHist(LoginHist loginHist);
}
