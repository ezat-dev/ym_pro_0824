package com.mes.domain.condition;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 조건관리 > 조절계 관리 (condition_controller) — 설비×존(zone)별 연간 온도조절계 정도검사(교정) 이력 1건.
 */
public class Regulator {

    private Long id;
    private Integer calibYear;
    private String equipName;
    private String zoneName;
    private BigDecimal stdTemp;
    private BigDecimal measTemp;
    private BigDecimal deviation;
    private String regUserName;
    private String useYn;
    private LocalDateTime regDt;
    private LocalDateTime updDt;

    // 목록 조회 시 자식 테이블 COUNT 서브쿼리로 채워지는 파일 개수.
    private Integer h1FileCount;
    private Integer h2FileCount;

    // 상세 조회 시에만 채워지는 반기별 첨부파일 목록.
    private List<RegulatorFile> h1Files;
    private List<RegulatorFile> h2Files;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getCalibYear() {
        return calibYear;
    }

    public void setCalibYear(Integer calibYear) {
        this.calibYear = calibYear;
    }

    public String getEquipName() {
        return equipName;
    }

    public void setEquipName(String equipName) {
        this.equipName = equipName;
    }

    public String getZoneName() {
        return zoneName;
    }

    public void setZoneName(String zoneName) {
        this.zoneName = zoneName;
    }

    public BigDecimal getStdTemp() {
        return stdTemp;
    }

    public void setStdTemp(BigDecimal stdTemp) {
        this.stdTemp = stdTemp;
    }

    public BigDecimal getMeasTemp() {
        return measTemp;
    }

    public void setMeasTemp(BigDecimal measTemp) {
        this.measTemp = measTemp;
    }

    public BigDecimal getDeviation() {
        return deviation;
    }

    public void setDeviation(BigDecimal deviation) {
        this.deviation = deviation;
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

    public Integer getH1FileCount() {
        return h1FileCount;
    }

    public void setH1FileCount(Integer h1FileCount) {
        this.h1FileCount = h1FileCount;
    }

    public Integer getH2FileCount() {
        return h2FileCount;
    }

    public void setH2FileCount(Integer h2FileCount) {
        this.h2FileCount = h2FileCount;
    }

    public List<RegulatorFile> getH1Files() {
        return h1Files;
    }

    public void setH1Files(List<RegulatorFile> h1Files) {
        this.h1Files = h1Files;
    }

    public List<RegulatorFile> getH2Files() {
        return h2Files;
    }

    public void setH2Files(List<RegulatorFile> h2Files) {
        this.h2Files = h2Files;
    }
}
