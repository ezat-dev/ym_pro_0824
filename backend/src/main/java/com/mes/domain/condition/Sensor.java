package com.mes.domain.condition;

import java.time.LocalDateTime;

/**
 * 조건관리 > 열전대/센서 관리 (condition_sensor) — 설비/존(zone)별 연간 열전대·센서 교체이력 1건.
 * prevChangeDate는 저장 컬럼이 아니라 조회 시 LAG(change_date) OVER(PARTITION BY equip_name, zone_name,
 * sensor_type ORDER BY year)로 계산되어 채워지는 값이다 — 등록/수정 요청에 이 필드가 실려 와도 서버는 무시한다.
 */
public class Sensor {

    private Long id;
    private Integer year;
    private String equipName;
    private String sensorType;
    private String zoneName;
    private String prevChangeDate;
    private String changeDate;
    private String nextChangeDate;
    private String remark;
    private String regUserName;
    private String useYn;
    private LocalDateTime regDt;
    private LocalDateTime updDt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getYear() {
        return year;
    }

    public void setYear(Integer year) {
        this.year = year;
    }

    public String getEquipName() {
        return equipName;
    }

    public void setEquipName(String equipName) {
        this.equipName = equipName;
    }

    public String getSensorType() {
        return sensorType;
    }

    public void setSensorType(String sensorType) {
        this.sensorType = sensorType;
    }

    public String getZoneName() {
        return zoneName;
    }

    public void setZoneName(String zoneName) {
        this.zoneName = zoneName;
    }

    public String getPrevChangeDate() {
        return prevChangeDate;
    }

    public void setPrevChangeDate(String prevChangeDate) {
        this.prevChangeDate = prevChangeDate;
    }

    public String getChangeDate() {
        return changeDate;
    }

    public void setChangeDate(String changeDate) {
        this.changeDate = changeDate;
    }

    public String getNextChangeDate() {
        return nextChangeDate;
    }

    public void setNextChangeDate(String nextChangeDate) {
        this.nextChangeDate = nextChangeDate;
    }

    public String getRemark() {
        return remark;
    }

    public void setRemark(String remark) {
        this.remark = remark;
    }

    public String getRegUserName() {
        return regUserName;
    }

    public void setRegUserName(String regUserName) {
        this.regUserName = regUserName;
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
