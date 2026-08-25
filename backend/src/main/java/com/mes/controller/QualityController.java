package com.mes.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mes.common.response.ApiResponse;
import com.mes.common.response.PageResponse;
import com.mes.domain.quality.Cpk;
import com.mes.domain.quality.Ppk;
import com.mes.domain.quality.Fproof;
import com.mes.domain.quality.TempUniform;
import com.mes.domain.quality.Hardness;
import com.mes.domain.quality.Nonconform;
import com.mes.service.QualityService;

/**
 * 품질관리(quality) 중분류 REST 엔드포인트.
 *
 * <p>1단계 골격 상태: 6개 메뉴(CPK분석/PPK분석/F-PROOF/온도균일성보고서/경도관리/부적합품관리) 모두
 * 목록 조회 API만 존재하며 실제 DB 테이블·등록/수정/삭제는 아직 구현되지 않았다.
 */
@RestController
@RequestMapping("/api/quality")
public class QualityController {

    private final QualityService qualityService;

    public QualityController(QualityService qualityService) {
        this.qualityService = qualityService;
    }

    @GetMapping("/cpk")
    public ApiResponse<PageResponse<Cpk>> getCpkList(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword) {
        return ApiResponse.success(qualityService.getCpkList(page, size, keyword));
    }

    @GetMapping("/ppk")
    public ApiResponse<PageResponse<Ppk>> getPpkList(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword) {
        return ApiResponse.success(qualityService.getPpkList(page, size, keyword));
    }

    @GetMapping("/fproof")
    public ApiResponse<PageResponse<Fproof>> getFproofList(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword) {
        return ApiResponse.success(qualityService.getFproofList(page, size, keyword));
    }

    @GetMapping("/tempUniform")
    public ApiResponse<PageResponse<TempUniform>> getTempUniformList(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword) {
        return ApiResponse.success(qualityService.getTempUniformList(page, size, keyword));
    }

    @GetMapping("/hardness")
    public ApiResponse<PageResponse<Hardness>> getHardnessList(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword) {
        return ApiResponse.success(qualityService.getHardnessList(page, size, keyword));
    }

    @GetMapping("/nonconform")
    public ApiResponse<PageResponse<Nonconform>> getNonconformList(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword) {
        return ApiResponse.success(qualityService.getNonconformList(page, size, keyword));
    }

}
