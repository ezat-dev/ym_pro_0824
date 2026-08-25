package com.mes.domain.condition;

import java.time.LocalDateTime;

/**
 * 조건관리 > 열전대/센서 관리 (tb_sensor) 1건.
 * TODO: 실제 컬럼은 2단계 DB 설계 확정 후 추가.
 */
public class Sensor {

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
