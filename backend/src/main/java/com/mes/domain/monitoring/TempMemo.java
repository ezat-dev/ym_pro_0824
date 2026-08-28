package com.mes.domain.monitoring;

/**
 * 모니터링 > TREND 차트 메모 주석 (ez_scada.tb_temp_memo) 1건.
 */
public class TempMemo {

    private Integer tcCnt;
    // tc_regtime 컬럼이 실제로는 DATETIME이 아니라 varchar(20)라서 LocalDateTime으로 받으면
    // MyBatis가 TIMESTAMP로 바인딩을 시도하다가 INSERT에서 500이 난다 — 원본(sample_pro)과 같이
    // 문자열 그대로 다룬다("yyyy-MM-dd HH:mm:ss" 형식으로 프론트에서 내려줌, 정렬도 문자열 비교로 충분).
    private String tcRegtime;
    private String tcName;
    private String tcDesc;
    private Integer tcUserCode;
    private String tcUserName;
    private String tcYn;

    public Integer getTcCnt() {
        return tcCnt;
    }

    public void setTcCnt(Integer tcCnt) {
        this.tcCnt = tcCnt;
    }

    public String getTcRegtime() {
        return tcRegtime;
    }

    public void setTcRegtime(String tcRegtime) {
        this.tcRegtime = tcRegtime;
    }

    public String getTcName() {
        return tcName;
    }

    public void setTcName(String tcName) {
        this.tcName = tcName;
    }

    public String getTcDesc() {
        return tcDesc;
    }

    public void setTcDesc(String tcDesc) {
        this.tcDesc = tcDesc;
    }

    public Integer getTcUserCode() {
        return tcUserCode;
    }

    public void setTcUserCode(Integer tcUserCode) {
        this.tcUserCode = tcUserCode;
    }

    public String getTcUserName() {
        return tcUserName;
    }

    public void setTcUserName(String tcUserName) {
        this.tcUserName = tcUserName;
    }

    public String getTcYn() {
        return tcYn;
    }

    public void setTcYn(String tcYn) {
        this.tcYn = tcYn;
    }
}
