package com.mes.domain.equipment;

import java.time.LocalDateTime;

/**
 * 설비관리 > SPARE 부품관리 (equipment_spare_part_history) 입출고 이력 1건.
 * type은 "IN"(입고) | "OUT"(사용) — qty는 항상 양수로 저장하고 부호는 type으로만 구분한다.
 */
public class SparePartHistory {

    private Long id;
    private Long sparePartId;
    private String type;
    private Integer qty;
    private String workDesc;
    private String regUserName;
    private LocalDateTime regDt;

    private String partName;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getSparePartId() {
        return sparePartId;
    }

    public void setSparePartId(Long sparePartId) {
        this.sparePartId = sparePartId;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Integer getQty() {
        return qty;
    }

    public void setQty(Integer qty) {
        this.qty = qty;
    }

    public String getWorkDesc() {
        return workDesc;
    }

    public void setWorkDesc(String workDesc) {
        this.workDesc = workDesc;
    }

    public String getRegUserName() {
        return regUserName;
    }

    public void setRegUserName(String regUserName) {
        this.regUserName = regUserName;
    }

    public LocalDateTime getRegDt() {
        return regDt;
    }

    public void setRegDt(LocalDateTime regDt) {
        this.regDt = regDt;
    }

    public String getPartName() {
        return partName;
    }

    public void setPartName(String partName) {
        this.partName = partName;
    }
}
