package com.mes.domain.base;

import java.time.LocalDateTime;

/**
 * 기준정보 > 로그인이력 (base_login_hist): 로그인 시도 1건 (성공/실패 모두 기록).
 */
public class LoginHist {

    private Long historyId;
    private String loginId;
    private String userName;
    private String loginIp;
    private String successYn;
    private String failReason;
    private LocalDateTime loginDt;

    public Long getHistoryId() {
        return historyId;
    }

    public void setHistoryId(Long historyId) {
        this.historyId = historyId;
    }

    public String getLoginId() {
        return loginId;
    }

    public void setLoginId(String loginId) {
        this.loginId = loginId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getLoginIp() {
        return loginIp;
    }

    public void setLoginIp(String loginIp) {
        this.loginIp = loginIp;
    }

    public String getSuccessYn() {
        return successYn;
    }

    public void setSuccessYn(String successYn) {
        this.successYn = successYn;
    }

    public String getFailReason() {
        return failReason;
    }

    public void setFailReason(String failReason) {
        this.failReason = failReason;
    }

    public LocalDateTime getLoginDt() {
        return loginDt;
    }

    public void setLoginDt(LocalDateTime loginDt) {
        this.loginDt = loginDt;
    }
}
