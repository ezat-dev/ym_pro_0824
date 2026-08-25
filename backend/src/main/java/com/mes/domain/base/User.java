package com.mes.domain.base;

import java.time.LocalDateTime;

/**
 * 기준정보 > 사용자관리 (base_user) 1건.
 */
public class User {

    private Long userId;
    private String loginId;
    private String password;
    private String userName;
    private String deptName;
    private String phone;
    private String email;
    private String useYn;
    private LocalDateTime regDt;
    private LocalDateTime updDt;

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getLoginId() {
        return loginId;
    }

    public void setLoginId(String loginId) {
        this.loginId = loginId;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getDeptName() {
        return deptName;
    }

    public void setDeptName(String deptName) {
        this.deptName = deptName;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getUseYn() {
        return useYn;
    }

    public void setUseYn(String useYn) {
        this.useYn = useYn;
    }

    public LocalDateTime getRegDt() {
        return regDt;
    }

    public void setRegDt(LocalDateTime regDt) {
        this.regDt = regDt;
    }

    public LocalDateTime getUpdDt() {
        return updDt;
    }

    public void setUpdDt(LocalDateTime updDt) {
        this.updDt = updDt;
    }
}
