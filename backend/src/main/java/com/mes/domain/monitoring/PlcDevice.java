package com.mes.domain.monitoring;

/**
 * PLC 장비 레지스트리 (ez_scada.tb_plc) 1건. 경보모니터링(폴더/태그 배정용)과
 * 조건관리 > 조절계 관리(장비 CRUD)가 같은 테이블을 공유한다 — sample_pro도
 * AlarmMapper/PlcConfigMapper 두 경로로 같은 tb_plc를 따로 접근한다.
 */
public class PlcDevice {

    private String plcId;
    private String ip;
    private Integer port;
    private String plcType;
    private String label;
    private Integer enabled;

    public String getPlcId() {
        return plcId;
    }

    public void setPlcId(String plcId) {
        this.plcId = plcId;
    }

    public String getIp() {
        return ip;
    }

    public void setIp(String ip) {
        this.ip = ip;
    }

    public Integer getPort() {
        return port;
    }

    public void setPort(Integer port) {
        this.port = port;
    }

    public String getPlcType() {
        return plcType;
    }

    public void setPlcType(String plcType) {
        this.plcType = plcType;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public Integer getEnabled() {
        return enabled;
    }

    public void setEnabled(Integer enabled) {
        this.enabled = enabled;
    }
}
