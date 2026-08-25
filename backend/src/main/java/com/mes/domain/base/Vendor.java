package com.mes.domain.base;

import java.time.LocalDateTime;

/**
 * 기준정보 > 거래처관리 (tb_vendor) 1건.
 * TODO: 실제 컬럼은 2단계 DB 설계 확정 후 추가.
 */
public class Vendor {

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
