package com.mes.service.impl;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mes.common.exception.BusinessException;
import com.mes.common.exception.ErrorCode;
import com.mes.common.response.PageResponse;
import com.mes.common.util.Paging;
import com.mes.dao.BaseDao;
import com.mes.domain.base.Auth;
import com.mes.domain.base.AuthMenuItem;
import com.mes.domain.base.LoginHist;
import com.mes.domain.base.LoginRequest;
import com.mes.domain.base.Pattern;
import com.mes.domain.base.Product;
import com.mes.domain.base.User;
import com.mes.domain.base.Vendor;
import com.mes.menu.domain.MenuGroup;
import com.mes.menu.domain.MenuItem;
import com.mes.menu.service.MenuService;
import com.mes.service.BaseService;

@Service
@Transactional(readOnly = true)
public class BaseServiceImpl implements BaseService {

    private final BaseDao baseDao;
    private final MenuService menuService;
    private final PasswordEncoder passwordEncoder;

    public BaseServiceImpl(BaseDao baseDao, MenuService menuService, PasswordEncoder passwordEncoder) {
        this.baseDao = baseDao;
        this.menuService = menuService;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public PageResponse<User> getUserList(int page, int size, String keyword) {
        int pageNum = Paging.normalizePage(page);
        int pageSize = Paging.normalizeSize(size);
        List<User> content = baseDao.selectUserList(Paging.offset(pageNum, pageSize), pageSize, keyword);
        content.forEach(u -> u.setPassword(null));
        long totalElements = baseDao.selectUserCount(keyword);
        return PageResponse.of(content, pageNum, pageSize, totalElements);
    }

    @Override
    @Transactional
    public User createUser(User user) {
        if (user.getLoginId() == null || user.getLoginId().isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_PARAMETER, "아이디를 입력해주세요.");
        }
        if (user.getPassword() == null || user.getPassword().isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_PARAMETER, "비밀번호를 입력해주세요.");
        }
        if (user.getUserName() == null || user.getUserName().isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_PARAMETER, "이름을 입력해주세요.");
        }
        if (baseDao.selectUserByLoginId(user.getLoginId()) != null) {
            throw new BusinessException(ErrorCode.INVALID_PARAMETER, "이미 사용 중인 아이디입니다.");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        if (user.getUseYn() == null || user.getUseYn().isBlank()) {
            user.setUseYn("Y");
        }
        baseDao.insertUser(user);
        User created = baseDao.selectUserById(user.getUserId());
        created.setPassword(null);
        return created;
    }

    @Override
    @Transactional
    public User updateUser(Long userId, User user) {
        User existing = baseDao.selectUserById(userId);
        if (existing == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "존재하지 않는 사용자입니다.");
        }
        if (user.getUserName() == null || user.getUserName().isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_PARAMETER, "이름을 입력해주세요.");
        }
        user.setUserId(userId);
        if (user.getPassword() != null && !user.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        } else {
            user.setPassword(null);
        }
        baseDao.updateUser(user);
        User updated = baseDao.selectUserById(userId);
        updated.setPassword(null);
        return updated;
    }

    @Override
    @Transactional
    public void deleteUser(Long userId) {
        if (baseDao.selectUserById(userId) == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "존재하지 않는 사용자입니다.");
        }
        baseDao.deleteAuthByUserId(userId);
        baseDao.deleteUser(userId);
    }

    @Override
    public PageResponse<Vendor> getVendorList(int page, int size, String keyword) {
        int pageNum = Paging.normalizePage(page);
        int pageSize = Paging.normalizeSize(size);
        List<Vendor> content = baseDao.selectVendorList(Paging.offset(pageNum, pageSize), pageSize, keyword);
        long totalElements = baseDao.selectVendorCount(keyword);
        return PageResponse.of(content, pageNum, pageSize, totalElements);
    }

    @Override
    public PageResponse<Product> getProductList(int page, int size, String keyword) {
        int pageNum = Paging.normalizePage(page);
        int pageSize = Paging.normalizeSize(size);
        List<Product> content = baseDao.selectProductList(Paging.offset(pageNum, pageSize), pageSize, keyword);
        long totalElements = baseDao.selectProductCount(keyword);
        return PageResponse.of(content, pageNum, pageSize, totalElements);
    }

    @Override
    public PageResponse<Pattern> getPatternList(int page, int size, String keyword) {
        int pageNum = Paging.normalizePage(page);
        int pageSize = Paging.normalizeSize(size);
        List<Pattern> content = baseDao.selectPatternList(Paging.offset(pageNum, pageSize), pageSize, keyword);
        long totalElements = baseDao.selectPatternCount(keyword);
        return PageResponse.of(content, pageNum, pageSize, totalElements);
    }

    @Override
    public List<AuthMenuItem> getAuthMenuItems(Long userId) {
        if (baseDao.selectUserById(userId) == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "존재하지 않는 사용자입니다.");
        }
        Map<String, Auth> grantByPath = new HashMap<>();
        for (Auth auth : baseDao.selectAuthByUserId(userId)) {
            grantByPath.put(auth.getMenuPath(), auth);
        }

        List<AuthMenuItem> items = new ArrayList<>();
        for (MenuGroup group : menuService.getMenuTree()) {
            for (MenuItem menu : group.getMenus()) {
                AuthMenuItem item = new AuthMenuItem(group.getCategory(), menu.getName(), menu.getPath());
                Auth grant = grantByPath.get(menu.getPath());
                if (grant != null) {
                    item.setCanCreate(grant.isCanCreate());
                    item.setCanRead(grant.isCanRead());
                    item.setCanUpdate(grant.isCanUpdate());
                    item.setCanDelete(grant.isCanDelete());
                }
                items.add(item);
            }
        }
        return items;
    }

    @Override
    @Transactional
    public void saveAuthMenuItems(Long userId, List<AuthMenuItem> items) {
        if (baseDao.selectUserById(userId) == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "존재하지 않는 사용자입니다.");
        }
        baseDao.deleteAuthByUserId(userId);
        baseDao.insertAuthList(userId, items);
    }

    @Override
    public PageResponse<LoginHist> getLoginHistList(int page, int size, String keyword) {
        int pageNum = Paging.normalizePage(page);
        int pageSize = Paging.normalizeSize(size);
        List<LoginHist> content = baseDao.selectLoginHistList(Paging.offset(pageNum, pageSize), pageSize, keyword);
        long totalElements = baseDao.selectLoginHistCount(keyword);
        return PageResponse.of(content, pageNum, pageSize, totalElements);
    }

    @Override
    @Transactional(noRollbackFor = BusinessException.class)
    public User login(LoginRequest request, String clientIp) {
        User user = baseDao.selectUserByLoginId(request.getLoginId());

        String failReason = null;
        if (user == null) {
            failReason = "존재하지 않는 아이디";
        } else if (!"Y".equals(user.getUseYn())) {
            failReason = "비활성화된 계정";
        } else if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            failReason = "비밀번호 불일치";
        }
        boolean success = failReason == null;

        LoginHist hist = new LoginHist();
        hist.setLoginId(request.getLoginId());
        hist.setUserName(user != null ? user.getUserName() : null);
        hist.setLoginIp(clientIp);
        hist.setSuccessYn(success ? "Y" : "N");
        hist.setFailReason(failReason);
        baseDao.insertLoginHist(hist);

        if (!success) {
            throw new BusinessException(ErrorCode.INVALID_PARAMETER, "아이디 또는 비밀번호가 일치하지 않습니다.");
        }
        user.setPassword(null);
        return user;
    }

}
