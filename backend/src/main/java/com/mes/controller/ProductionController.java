package com.mes.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mes.common.response.ApiResponse;
import com.mes.common.response.PageResponse;
import com.mes.domain.production.WorkOrder;
import com.mes.domain.production.ByItem;
import com.mes.domain.production.EquipEff;
import com.mes.domain.production.DailyReport;
import com.mes.domain.production.LotReport;
import com.mes.service.ProductionService;

/**
 * 생산관리(production) 중분류 REST 엔드포인트.
 *
 * <p>1단계 골격 상태: 5개 메뉴(작업지시관리/제품별작업관리/설비효율현황/작업일보/LOT보고서) 모두
 * 목록 조회 API만 존재하며 실제 DB 테이블·등록/수정/삭제는 아직 구현되지 않았다.
 */
@RestController
@RequestMapping("/api/production")
public class ProductionController {

    private final ProductionService productionService;

    public ProductionController(ProductionService productionService) {
        this.productionService = productionService;
    }

    @GetMapping("/workOrder")
    public ApiResponse<PageResponse<WorkOrder>> getWorkOrderList(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword) {
        return ApiResponse.success(productionService.getWorkOrderList(page, size, keyword));
    }

    @GetMapping("/byItem")
    public ApiResponse<PageResponse<ByItem>> getByItemList(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword) {
        return ApiResponse.success(productionService.getByItemList(page, size, keyword));
    }

    @GetMapping("/equipEff")
    public ApiResponse<PageResponse<EquipEff>> getEquipEffList(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword) {
        return ApiResponse.success(productionService.getEquipEffList(page, size, keyword));
    }

    @GetMapping("/dailyReport")
    public ApiResponse<PageResponse<DailyReport>> getDailyReportList(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword) {
        return ApiResponse.success(productionService.getDailyReportList(page, size, keyword));
    }

    @GetMapping("/lotReport")
    public ApiResponse<PageResponse<LotReport>> getLotReportList(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword) {
        return ApiResponse.success(productionService.getLotReportList(page, size, keyword));
    }

}
