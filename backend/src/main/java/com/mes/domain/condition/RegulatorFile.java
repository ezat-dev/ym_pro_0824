package com.mes.domain.condition;

import java.time.LocalDateTime;

/**
 * 조건관리 > 조절계 관리의 반기별(H1/H2) 첨부파일 1건 (condition_controller_file).
 */
public class RegulatorFile {

    private Long id;
    private Long controllerId;
    private String half;
    private String fileName;
    private String origFileName;
    private Long fileSize;
    private LocalDateTime regDt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getControllerId() {
        return controllerId;
    }

    public void setControllerId(Long controllerId) {
        this.controllerId = controllerId;
    }

    public String getHalf() {
        return half;
    }

    public void setHalf(String half) {
        this.half = half;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getOrigFileName() {
        return origFileName;
    }

    public void setOrigFileName(String origFileName) {
        this.origFileName = origFileName;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public LocalDateTime getRegDt() {
        return regDt;
    }

    public void setRegDt(LocalDateTime regDt) {
        this.regDt = regDt;
    }
}
