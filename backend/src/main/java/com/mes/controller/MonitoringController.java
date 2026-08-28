package com.mes.controller;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mes.common.response.ApiResponse;
import com.mes.common.response.PageResponse;
import com.mes.domain.monitoring.ProdStatus;
import com.mes.domain.monitoring.Integrated;
import com.mes.domain.monitoring.Alarm;
import com.mes.domain.monitoring.AlarmRank;
import com.mes.domain.monitoring.AlarmFolder;
import com.mes.domain.monitoring.AlarmTag;
import com.mes.domain.monitoring.PlcDevice;
import com.mes.domain.monitoring.Trend;
import com.mes.domain.monitoring.TempTag;
import com.mes.domain.monitoring.TempMemo;
import com.mes.domain.monitoring.LotStatus;
import com.mes.domain.monitoring.LotTracking;
import com.mes.service.MonitoringService;

/**
 * 모니터링(monitoring) 중분류 REST 엔드포인트.
 *
 * <p>경보모니터링(alarm)·경보랭킹(alarmRank)은 ez_scada 실데이터 CRUD/집계 API다
 * (sample_pro AlarmController와 같은 물리 스키마 공유). 나머지 5개 메뉴는 아직 1단계 골격.
 */
@RestController
@RequestMapping("/api/monitoring")
public class MonitoringController {

    private final MonitoringService monitoringService;

    public MonitoringController(MonitoringService monitoringService) {
        this.monitoringService = monitoringService;
    }

    @GetMapping("/prodStatus")
    public ApiResponse<PageResponse<ProdStatus>> getProdStatusList(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword) {
        return ApiResponse.success(monitoringService.getProdStatusList(page, size, keyword));
    }

    @GetMapping("/integrated")
    public ApiResponse<PageResponse<Integrated>> getIntegratedList(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword) {
        return ApiResponse.success(monitoringService.getIntegratedList(page, size, keyword));
    }

    @GetMapping("/alarm")
    public ApiResponse<PageResponse<Alarm>> getAlarmList(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword) {
        return ApiResponse.success(monitoringService.getAlarmList(page, size, keyword));
    }

    @GetMapping("/alarm/active")
    public ApiResponse<List<Alarm>> getActiveAlarms(@RequestParam(defaultValue = "50") int limit) {
        return ApiResponse.success(monitoringService.getActiveAlarms(limit));
    }

    @GetMapping("/alarm/history")
    public ApiResponse<List<Alarm>> getAlarmHistory(@RequestParam(defaultValue = "500") int limit) {
        return ApiResponse.success(monitoringService.getAlarmHistory(limit));
    }

    @GetMapping("/alarm/historyRange")
    public ApiResponse<List<Alarm>> getAlarmHistoryRange(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        return ApiResponse.success(monitoringService.getAlarmHistoryRange(from, to));
    }

    @GetMapping("/alarm/folders")
    public ApiResponse<List<AlarmFolder>> getAlarmFolders() {
        return ApiResponse.success(monitoringService.getAlarmFolderList());
    }

    @PostMapping("/alarm/folders")
    public ApiResponse<Void> createAlarmFolder(@RequestBody AlarmFolder folder) {
        monitoringService.createAlarmFolder(folder);
        return ApiResponse.success();
    }

    @DeleteMapping("/alarm/folders/{folderId}")
    public ApiResponse<Void> deleteAlarmFolder(@PathVariable int folderId) {
        monitoringService.deleteAlarmFolder(folderId);
        return ApiResponse.success();
    }

    @GetMapping("/alarm/tags")
    public ApiResponse<List<AlarmTag>> getAlarmTags(@RequestParam(defaultValue = "0") int folderId) {
        return ApiResponse.success(monitoringService.getAlarmTagList(folderId));
    }

    @PostMapping("/alarm/tags")
    public ApiResponse<Void> createAlarmTag(@RequestBody AlarmTag tag) {
        monitoringService.createAlarmTag(tag);
        return ApiResponse.success();
    }

    @PutMapping("/alarm/tags/{tagId}")
    public ApiResponse<Void> updateAlarmTag(@PathVariable int tagId, @RequestBody AlarmTag tag) {
        tag.setTagId(tagId);
        monitoringService.updateAlarmTag(tag);
        return ApiResponse.success();
    }

    @DeleteMapping("/alarm/tags/{tagId}")
    public ApiResponse<Void> deleteAlarmTag(@PathVariable int tagId) {
        monitoringService.deleteAlarmTag(tagId);
        return ApiResponse.success();
    }

    @GetMapping("/alarm/plcs")
    public ApiResponse<List<PlcDevice>> getAlarmPlcs() {
        return ApiResponse.success(monitoringService.getAlarmPlcList());
    }

    @PostMapping("/alarm/plcs")
    public ApiResponse<Void> saveAlarmPlc(@RequestBody PlcDevice plc) {
        monitoringService.saveAlarmPlc(plc);
        return ApiResponse.success();
    }

    @DeleteMapping("/alarm/plcs/{plcId}")
    public ApiResponse<Void> deleteAlarmPlc(@PathVariable String plcId) {
        monitoringService.deleteAlarmPlc(plcId);
        return ApiResponse.success();
    }

    @GetMapping("/alarmRank")
    public ApiResponse<List<AlarmRank>> getAlarmRank(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(defaultValue = "tag") String groupBy) {
        return ApiResponse.success(monitoringService.getAlarmRank(from, to, groupBy));
    }

    @GetMapping("/alarm/messagesByFolder")
    public ApiResponse<List<Map<String, Object>>> getAlarmMessageCountsByFolder(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        return ApiResponse.success(monitoringService.getAlarmMessageCountsByFolder(from, to));
    }

    @GetMapping("/alarm/trend")
    public ApiResponse<List<Map<String, Object>>> getAlarmTrendOverall(
            @RequestParam(defaultValue = "24") int hours) {
        return ApiResponse.success(monitoringService.getAlarmTrendOverall(hours));
    }

    @GetMapping("/alarm/trendByFolder")
    public ApiResponse<List<Map<String, Object>>> getAlarmTrendByFolder(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(defaultValue = "DAY") String bucketUnit) {
        return ApiResponse.success(monitoringService.getAlarmTrendByFolder(from, to, bucketUnit));
    }

    @GetMapping("/alarm/trendBySeverity")
    public ApiResponse<List<Map<String, Object>>> getAlarmTrendBySeverity(
            @RequestParam(defaultValue = "24") int hours) {
        return ApiResponse.success(monitoringService.getAlarmTrendBySeverity(hours));
    }

    @GetMapping("/alarm/countByFolderSeverity")
    public ApiResponse<List<Map<String, Object>>> getAlarmCountByFolderSeverity(
            @RequestParam(defaultValue = "24") int hours) {
        return ApiResponse.success(monitoringService.getAlarmCountByFolderSeverity(hours));
    }

    @GetMapping("/alarm/responseTimeTrend")
    public ApiResponse<List<Map<String, Object>>> getAlarmResponseTimeTrend(
            @RequestParam(defaultValue = "24") int hours) {
        return ApiResponse.success(monitoringService.getAlarmResponseTimeTrend(hours));
    }

    @GetMapping("/trendSettings")
    public ApiResponse<List<TempTag>> getTrendSettingsTagList() {
        return ApiResponse.success(monitoringService.getTempTagFullList());
    }

    @PostMapping("/trendSettings")
    public ApiResponse<Void> createTrendSettingsTag(@RequestBody TempTag tag) {
        monitoringService.insertTempTag(tag);
        return ApiResponse.success();
    }

    @PutMapping("/trendSettings/{tempId}")
    public ApiResponse<Void> updateTrendSettingsTag(@PathVariable int tempId, @RequestBody TempTag tag) {
        tag.setTempId(tempId);
        monitoringService.updateTempTag(tag);
        return ApiResponse.success();
    }

    @DeleteMapping("/trendSettings/{tempId}")
    public ApiResponse<Void> deleteTrendSettingsTag(@PathVariable int tempId) {
        monitoringService.deleteTempTag(tempId);
        return ApiResponse.success();
    }

    @GetMapping("/trendSettings/snapshots")
    public ApiResponse<List<Map<String, Object>>> getTrendSettingsSnapshots(
            @RequestParam(defaultValue = "200") int limit) {
        return ApiResponse.success(monitoringService.getTempSnapshotList(limit));
    }

    @GetMapping("/trend/snapshotRange")
    public ApiResponse<List<Map<String, Object>>> getTrendSnapshotRange(
            @RequestParam String from, @RequestParam String to) {
        return ApiResponse.success(monitoringService.getTempSnapshotRange(from, to));
    }

    @GetMapping("/trend/memos")
    public ApiResponse<List<TempMemo>> getTrendMemos(
            @RequestParam String from, @RequestParam String to) {
        return ApiResponse.success(monitoringService.getMemoList(from, to));
    }

    @PostMapping("/trend/memos")
    public ApiResponse<Void> createTrendMemo(@RequestBody TempMemo memo) {
        monitoringService.insertMemo(memo);
        return ApiResponse.success();
    }

    @DeleteMapping("/trend/memos/{tcCnt}")
    public ApiResponse<Void> deleteTrendMemo(@PathVariable int tcCnt) {
        monitoringService.deleteMemo(tcCnt);
        return ApiResponse.success();
    }

    @GetMapping("/trend")
    public ApiResponse<PageResponse<Trend>> getTrendList(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword) {
        return ApiResponse.success(monitoringService.getTrendList(page, size, keyword));
    }

    @GetMapping("/lotStatus")
    public ApiResponse<PageResponse<LotStatus>> getLotStatusList(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword) {
        return ApiResponse.success(monitoringService.getLotStatusList(page, size, keyword));
    }

    @GetMapping("/lotTracking")
    public ApiResponse<PageResponse<LotTracking>> getLotTrackingList(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword) {
        return ApiResponse.success(monitoringService.getLotTrackingList(page, size, keyword));
    }

}
