package com.mes.domain.monitoring;

import java.time.LocalDateTime;

/**
 * 모니터링 > 경보모니터링 (ez_scada.tb_alarm_history, tb_alarm_tag와 JOIN) 1건.
 */
public class Alarm {

    private Long historyId;
    private Integer tagId;
    private String tagName;
    private String address;
    private String alarmMsg;
    private Integer level;
    private String plcId;
    private Integer folderId;
    private String folderName;
    private LocalDateTime occurTime;
    private LocalDateTime clearTime;
    private LocalDateTime ackTime;
    private String ackUser;
    private String valueAtOccur;

    public Long getHistoryId() {
        return historyId;
    }

    public void setHistoryId(Long historyId) {
        this.historyId = historyId;
    }

    public Integer getTagId() {
        return tagId;
    }

    public void setTagId(Integer tagId) {
        this.tagId = tagId;
    }

    public String getTagName() {
        return tagName;
    }

    public void setTagName(String tagName) {
        this.tagName = tagName;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getAlarmMsg() {
        return alarmMsg;
    }

    public void setAlarmMsg(String alarmMsg) {
        this.alarmMsg = alarmMsg;
    }

    public Integer getLevel() {
        return level;
    }

    public void setLevel(Integer level) {
        this.level = level;
    }

    public String getPlcId() {
        return plcId;
    }

    public void setPlcId(String plcId) {
        this.plcId = plcId;
    }

    public Integer getFolderId() {
        return folderId;
    }

    public void setFolderId(Integer folderId) {
        this.folderId = folderId;
    }

    public String getFolderName() {
        return folderName;
    }

    public void setFolderName(String folderName) {
        this.folderName = folderName;
    }

    public LocalDateTime getOccurTime() {
        return occurTime;
    }

    public void setOccurTime(LocalDateTime occurTime) {
        this.occurTime = occurTime;
    }

    public LocalDateTime getClearTime() {
        return clearTime;
    }

    public void setClearTime(LocalDateTime clearTime) {
        this.clearTime = clearTime;
    }

    public LocalDateTime getAckTime() {
        return ackTime;
    }

    public void setAckTime(LocalDateTime ackTime) {
        this.ackTime = ackTime;
    }

    public String getAckUser() {
        return ackUser;
    }

    public void setAckUser(String ackUser) {
        this.ackUser = ackUser;
    }

    public String getValueAtOccur() {
        return valueAtOccur;
    }

    public void setValueAtOccur(String valueAtOccur) {
        this.valueAtOccur = valueAtOccur;
    }
}
