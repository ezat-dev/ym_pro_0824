package com.mes.domain.condition;

import java.time.LocalDateTime;

/**
 * 조건관리 > 열처리유성상분석 (condition_oil_analysis) — 설비별 오일 성상분석 등록 1건.
 * PDF 첨부는 항상 4개 고정 슬롯(① 분석보고서/② 냉각시험 그래프/③④ 기타파일)이라 자식 테이블 대신
 * 한 행에 파일명/원본파일명/파일크기 세트를 4개 둔다.
 */
public class OilAnalysis {

    private Long id;
    private String crDate;
    private String mchName;
    private String memo;

    private String box1FileName;
    private String box1OrigFileName;
    private Long box1FileSize;

    private String box2FileName;
    private String box2OrigFileName;
    private Long box2FileSize;

    private String box3FileName;
    private String box3OrigFileName;
    private Long box3FileSize;

    private String box4FileName;
    private String box4OrigFileName;
    private Long box4FileSize;

    private String useYn;
    private LocalDateTime regDt;
    private LocalDateTime updDt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCrDate() {
        return crDate;
    }

    public void setCrDate(String crDate) {
        this.crDate = crDate;
    }

    public String getMchName() {
        return mchName;
    }

    public void setMchName(String mchName) {
        this.mchName = mchName;
    }

    public String getMemo() {
        return memo;
    }

    public void setMemo(String memo) {
        this.memo = memo;
    }

    public String getBox1FileName() {
        return box1FileName;
    }

    public void setBox1FileName(String box1FileName) {
        this.box1FileName = box1FileName;
    }

    public String getBox1OrigFileName() {
        return box1OrigFileName;
    }

    public void setBox1OrigFileName(String box1OrigFileName) {
        this.box1OrigFileName = box1OrigFileName;
    }

    public Long getBox1FileSize() {
        return box1FileSize;
    }

    public void setBox1FileSize(Long box1FileSize) {
        this.box1FileSize = box1FileSize;
    }

    public String getBox2FileName() {
        return box2FileName;
    }

    public void setBox2FileName(String box2FileName) {
        this.box2FileName = box2FileName;
    }

    public String getBox2OrigFileName() {
        return box2OrigFileName;
    }

    public void setBox2OrigFileName(String box2OrigFileName) {
        this.box2OrigFileName = box2OrigFileName;
    }

    public Long getBox2FileSize() {
        return box2FileSize;
    }

    public void setBox2FileSize(Long box2FileSize) {
        this.box2FileSize = box2FileSize;
    }

    public String getBox3FileName() {
        return box3FileName;
    }

    public void setBox3FileName(String box3FileName) {
        this.box3FileName = box3FileName;
    }

    public String getBox3OrigFileName() {
        return box3OrigFileName;
    }

    public void setBox3OrigFileName(String box3OrigFileName) {
        this.box3OrigFileName = box3OrigFileName;
    }

    public Long getBox3FileSize() {
        return box3FileSize;
    }

    public void setBox3FileSize(Long box3FileSize) {
        this.box3FileSize = box3FileSize;
    }

    public String getBox4FileName() {
        return box4FileName;
    }

    public void setBox4FileName(String box4FileName) {
        this.box4FileName = box4FileName;
    }

    public String getBox4OrigFileName() {
        return box4OrigFileName;
    }

    public void setBox4OrigFileName(String box4OrigFileName) {
        this.box4OrigFileName = box4OrigFileName;
    }

    public Long getBox4FileSize() {
        return box4FileSize;
    }

    public void setBox4FileSize(Long box4FileSize) {
        this.box4FileSize = box4FileSize;
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
