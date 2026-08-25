package com.mes.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mes.common.response.ApiResponse;
import com.mes.common.response.PageResponse;
import com.mes.domain.equipment.DownStatus;
import com.mes.domain.equipment.UtilRate;
import com.mes.domain.equipment.PowerUsage;
import com.mes.domain.equipment.History;
import com.mes.domain.equipment.RepairHist;
import com.mes.domain.equipment.SparePart;
import com.mes.service.EquipmentService;

/**
 * 설비관리(equipment) 중분류 REST 엔드포인트.
 *
 * <p>1단계 골격 상태: 6개 메뉴(설비비가동현황/설비가동률분석/전력량/설비이력관리/수리이력관리/SPARE부품관리) 모두
 * 목록 조회 API만 존재하며 실제 DB 테이블·등록/수정/삭제는 아직 구현되지 않았다.
 */
@RestController
@RequestMapping("/api/equipment")
public class EquipmentController {

    private final EquipmentService equipmentService;

    public EquipmentController(EquipmentService equipmentService) {
        this.equipmentService = equipmentService;
    }

    @GetMapping("/downStatus")
    public ApiResponse<PageResponse<DownStatus>> getDownStatusList(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword) {
        return ApiResponse.success(equipmentService.getDownStatusList(page, size, keyword));
    }

    @GetMapping("/utilRate")
    public ApiResponse<PageResponse<UtilRate>> getUtilRateList(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword) {
        return ApiResponse.success(equipmentService.getUtilRateList(page, size, keyword));
    }

    @GetMapping("/powerUsage")
    public ApiResponse<PageResponse<PowerUsage>> getPowerUsageList(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword) {
        return ApiResponse.success(equipmentService.getPowerUsageList(page, size, keyword));
    }

    @GetMapping("/history")
    public ApiResponse<PageResponse<History>> getHistoryList(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword) {
        return ApiResponse.success(equipmentService.getHistoryList(page, size, keyword));
    }

    @GetMapping("/repairHist")
    public ApiResponse<PageResponse<RepairHist>> getRepairHistList(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword) {
        return ApiResponse.success(equipmentService.getRepairHistList(page, size, keyword));
    }

    @GetMapping("/sparePart")
    public ApiResponse<PageResponse<SparePart>> getSparePartList(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword) {
        return ApiResponse.success(equipmentService.getSparePartList(page, size, keyword));
    }

}
