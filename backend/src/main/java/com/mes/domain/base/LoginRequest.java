package com.mes.domain.base;

/**
 * 로그인 화면에서 전송하는 로그인 요청 바디.
 */
public class LoginRequest {

    private String loginId;
    private String password;

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
}
