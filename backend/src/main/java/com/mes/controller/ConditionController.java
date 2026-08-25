package com.mes.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mes.common.response.ApiResponse;
import com.mes.common.response.PageResponse;
import com.mes.domain.condition.Sensor;
import com.mes.domain.condition.Regulator;
import com.mes.domain.condition.OilAnalysis;
import com.mes.domain.condition.DailyCheck;
import com.mes.domain.condition.Standard;
import com.mes.service.ConditionService;

/**
 * 조건관리(condition) 중분류 REST 엔드포인트.
 *
 * <p>1단계 골격 상태: 5개 메뉴(열전대/센서 관리/조절계 관리/열처리유성상분석/일상점검일지/관리계획서 및 작업표준서) 모두
 * 목록 조회 API만 존재하며 실제 DB 테이블·등록/수정/삭제는 아직 구현되지 않았다.
 * 조절계 관리는 클래스명이 Controller와 겹쳐서 Regulator로 대체 명명했다.
 */
@RestController
@RequestMapping("/api/condition")
public class ConditionController {

    private final ConditionService conditionService;

    public ConditionController(ConditionService conditionService) {
        this.conditionService = conditionService;
    }

    @GetMapping("/sensor")
    public ApiResponse<PageResponse<Sensor>> getSensorList(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword) {
        return ApiResponse.success(conditionService.getSensorList(page, size, keyword));
    }

    @GetMapping("/controller")
    public ApiResponse<PageResponse<Regulator>> getRegulatorList(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword) {
        return ApiResponse.success(conditionService.getRegulatorList(page, size, keyword));
    }

    @GetMapping("/oilAnalysis")
    public ApiResponse<PageResponse<OilAnalysis>> getOilAnalysisList(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword) {
        return ApiResponse.success(conditionService.getOilAnalysisList(page, size, keyword));
    }

    @GetMapping("/dailyCheck")
    public ApiResponse<PageResponse<DailyCheck>> getDailyCheckList(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword) {
        return ApiResponse.success(conditionService.getDailyCheckList(page, size, keyword));
    }

    @GetMapping("/standard")
    public ApiResponse<PageResponse<Standard>> getStandardList(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword) {
        return ApiResponse.success(conditionService.getStandardList(page, size, keyword));
    }

}
