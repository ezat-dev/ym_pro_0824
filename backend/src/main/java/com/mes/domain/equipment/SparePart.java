package com.mes.domain.equipment;

import java.time.LocalDateTime;

/**
 * 설비관리 > SPARE 부품관리 (equipment_spare_part) 1건.
 * currentStock/stockStatus는 저장 컬럼이 아니라 조회 시 equipment_spare_part_history(입출고 이력)에서
 * 매번 계산되어 채워지는 값이다 — 등록/수정 요청에 이 필드가 실려 와도 서버는 무시한다.
 */
public class SparePart {

    private Long id;
    private String partName;
    private String equipName;
    private String standard;
    private String maker;
    private String unit;
    private Integer safeStock;
    private String replaceType;
    private String buyCycle;
    private String storageLocation;
    private String rackNo;
    private String remark;
    private String regUserName;
    private String useYn;
    private LocalDateTime regDt;
    private LocalDateTime updDt;

    private Integer currentStock;
    private String stockStatus;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getPartName() {
        return partName;
    }

    public void setPartName(String partName) {
        this.partName = partName;
    }

    public String getEquipName() {
        return equipName;
    }

    public void setEquipName(String equipName) {
        this.equipName = equipName;
    }

    public String getStandard() {
        return standard;
    }

    public void setStandard(String standard) {
        this.standard = standard;
    }

    public String getMaker() {
        return maker;
    }

    public void setMaker(String maker) {
        this.maker = maker;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public Integer getSafeStock() {
        return safeStock;
    }

    public void setSafeStock(Integer safeStock) {
        this.safeStock = safeStock;
    }

    public String getReplaceType() {
        return replaceType;
    }

    public void setReplaceType(String replaceType) {
        this.replaceType = replaceType;
    }

    public String getBuyCycle() {
        return buyCycle;
    }

    public void setBuyCycle(String buyCycle) {
        this.buyCycle = buyCycle;
    }

    public String getStorageLocation() {
        return storageLocation;
    }

    public void setStorageLocation(String storageLocation) {
        this.storageLocation = storageLocation;
    }

    public String getRackNo() {
        return rackNo;
    }

    public void setRackNo(String rackNo) {
        this.rackNo = rackNo;
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

    public Integer getCurrentStock() {
        return currentStock;
    }

    public void setCurrentStock(Integer currentStock) {
        this.currentStock = currentStock;
    }

    public String getStockStatus() {
        return stockStatus;
    }

    public void setStockStatus(String stockStatus) {
        this.stockStatus = stockStatus;
    }
}
