package com.mes.domain.equipment;

import java.time.LocalDateTime;

/**
 * 설비관리 > 수리이력관리 (tb_repair_hist) 1건.
 * TODO: 실제 컬럼은 2단계 DB 설계 확정 후 추가.
 */
public class RepairHist {

    private Long id;
    private String useYn;
    private LocalDateTime regDt;
    private LocalDateTime updDt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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
