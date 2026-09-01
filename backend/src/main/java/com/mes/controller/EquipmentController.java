package com.mes.controller;

import java.util.List;

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
import com.mes.domain.equipment.DownStatus;
import com.mes.domain.equipment.UtilRate;
import com.mes.domain.equipment.PowerUsage;
import com.mes.domain.equipment.History;
import com.mes.domain.equipment.RepairHist;
import com.mes.domain.equipment.SparePart;
import com.mes.domain.equipment.SparePartHistory;
import com.mes.service.EquipmentService;

/**
 * 설비관리(equipment) 중분류 REST 엔드포인트.
 *
 * <p>설비비가동현황/설비가동률분석/전력량/설비이력관리/수리이력관리 5개 메뉴는 여전히 1단계 골격(목록 조회 API만
 * 존재)이다. SPARE 부품관리(equipment_spare_part/_history)는 실제 구현됨 — 재고는 저장하지 않고
 * 입출고 이력에서 매번 계산한다(SparePartMapper.selectList 참고).
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
    public ApiResponse<List<SparePart>> getSparePartList(
            @RequestParam(required = false) String equipName,
            @RequestParam(required = false) String keyword) {
        return ApiResponse.success(equipmentService.getSparePartList(equipName, keyword));
    }

    @GetMapping("/sparePart/equipNames")
    public ApiResponse<List<String>> getSparePartEquipNames() {
        return ApiResponse.success(equipmentService.getSparePartEquipNames());
    }

    @GetMapping("/sparePart/{id}")
    public ApiResponse<SparePart> getSparePartById(@PathVariable Long id) {
        return ApiResponse.success(equipmentService.getSparePartById(id));
    }

    @PostMapping("/sparePart")
    public ApiResponse<SparePart> createSparePart(
            @RequestBody SparePart sparePart,
            @RequestParam(required = false) Integer initialQty) {
        return ApiResponse.success(equipmentService.createSparePart(sparePart, initialQty, sparePart.getRegUserName()));
    }

    @PutMapping("/sparePart/{id}")
    public ApiResponse<Void> updateSparePart(@PathVariable Long id, @RequestBody SparePart sparePart) {
        sparePart.setId(id);
        equipmentService.updateSparePart(sparePart);
        return ApiResponse.success();
    }

    @PostMapping("/sparePart/delete")
    public ApiResponse<Void> deleteSpareParts(@RequestBody List<Long> ids) {
        equipmentService.deleteSpareParts(ids);
        return ApiResponse.success();
    }

    @GetMapping("/sparePart/history")
    public ApiResponse<List<SparePartHistory>> getSparePartHistoryList(
            @RequestParam(required = false) Long partId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        return ApiResponse.success(equipmentService.getSparePartHistoryList(partId, type, from, to));
    }

    @PostMapping("/sparePart/history")
    public ApiResponse<Void> createSparePartHistory(@RequestBody SparePartHistory history) {
        equipmentService.createSparePartHistory(history);
        return ApiResponse.success();
    }

    @DeleteMapping("/sparePart/history/{id}")
    public ApiResponse<Void> deleteSparePartHistory(@PathVariable Long id) {
        equipmentService.deleteSparePartHistory(id);
        return ApiResponse.success();
    }

}
