package com.mes.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mes.common.response.ApiResponse;
import com.mes.common.response.PageResponse;
import com.mes.domain.monitoring.ProdStatus;
import com.mes.domain.monitoring.Integrated;
import com.mes.domain.monitoring.Alarm;
import com.mes.domain.monitoring.AlarmRank;
import com.mes.domain.monitoring.Trend;
import com.mes.domain.monitoring.LotStatus;
import com.mes.domain.monitoring.LotTracking;
import com.mes.service.MonitoringService;

/**
 * 모니터링(monitoring) 중분류 REST 엔드포인트.
 *
 * <p>1단계 골격 상태: 7개 메뉴(종합생산현황/통합모니터링/경보모니터링/경보랭킹/TREND/LOT현황/LOT트래킹) 모두
 * 목록 조회 API만 존재하며 실제 DB 테이블·등록/수정/삭제는 아직 구현되지 않았다.
 * 실 데이터 연동 시 이 클래스와 MonitoringService/MonitoringDao만 교체하면 된다.
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

    @GetMapping("/alarmRank")
    public ApiResponse<PageResponse<AlarmRank>> getAlarmRankList(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword) {
        return ApiResponse.success(monitoringService.getAlarmRankList(page, size, keyword));
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
