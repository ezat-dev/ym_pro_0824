package com.mes.service;

import java.util.List;

import com.mes.common.response.PageResponse;
import com.mes.domain.base.AuthMenuItem;
import com.mes.domain.base.LoginHist;
import com.mes.domain.base.LoginRequest;
import com.mes.domain.base.Pattern;
import com.mes.domain.base.Product;
import com.mes.domain.base.User;
import com.mes.domain.base.Vendor;

public interface BaseService {

    PageResponse<User> getUserList(int page, int size, String keyword);

    User createUser(User user);

    User updateUser(Long userId, User user);

    void deleteUser(Long userId);

    PageResponse<Vendor> getVendorList(int page, int size, String keyword);

    PageResponse<Product> getProductList(int page, int size, String keyword);

    PageResponse<Pattern> getPatternList(int page, int size, String keyword);

    List<AuthMenuItem> getAuthMenuItems(Long userId);

    void saveAuthMenuItems(Long userId, List<AuthMenuItem> items);

    PageResponse<LoginHist> getLoginHistList(int page, int size, String keyword);

    User login(LoginRequest request, String clientIp);

}
