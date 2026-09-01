package com.mes.controller;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.List;

import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.mes.common.exception.BusinessException;
import com.mes.common.exception.ErrorCode;
import com.mes.common.response.ApiResponse;
import com.mes.domain.condition.Sensor;
import com.mes.domain.condition.Regulator;
import com.mes.domain.condition.RegulatorFile;
import com.mes.domain.condition.OilAnalysis;
import com.mes.domain.condition.DailyCheck;
import com.mes.domain.condition.Standard;
import com.mes.service.ConditionService;

/**
 * 조건관리(condition) 중분류 REST 엔드포인트.
 *
 * <p>조건관리 5개 메뉴 전부 실제 구현됨: 일상점검일지(월별 체크리스트 그리드, {@code condition_daily_check}),
 * 관리계획서 및 작업표준서(문서 라이브러리, {@code condition_standard}), 조절계 관리(온도조절계 정도검사 이력,
 * {@code condition_controller}/{@code _file}), 열전대/센서 관리(존별 열전대 교체이력, {@code condition_sensor}),
 * 열처리유성상분석(오일 성상분석 PDF 등록대장, {@code condition_oil_analysis}).
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
    public ApiResponse<List<Sensor>> getSensorList(
            @RequestParam int year,
            @RequestParam(required = false) String sensorType) {
        return ApiResponse.success(conditionService.getSensorList(year, sensorType));
    }

    @PostMapping("/sensor")
    public ApiResponse<Void> createSensor(@RequestBody Sensor sensor) {
        conditionService.createSensor(sensor);
        return ApiResponse.success();
    }

    @PutMapping("/sensor/{id}")
    public ApiResponse<Void> updateSensor(@PathVariable Long id, @RequestBody Sensor sensor) {
        sensor.setId(id);
        conditionService.updateSensor(sensor);
        return ApiResponse.success();
    }

    @PostMapping("/sensor/delete")
    public ApiResponse<Void> deleteSensors(@RequestBody List<Long> ids) {
        conditionService.deleteSensors(ids);
        return ApiResponse.success();
    }

    @GetMapping("/controller")
    public ApiResponse<List<Regulator>> getRegulatorList(
            @RequestParam int year,
            @RequestParam(required = false) String equipName) {
        return ApiResponse.success(conditionService.getRegulatorList(year, equipName));
    }

    @GetMapping("/controller/equipNames")
    public ApiResponse<List<String>> getRegulatorEquipNames() {
        return ApiResponse.success(conditionService.getRegulatorEquipNames());
    }

    @GetMapping("/controller/{id}")
    public ApiResponse<Regulator> getRegulatorById(@PathVariable Long id) {
        return ApiResponse.success(conditionService.getRegulatorById(id));
    }

    @PostMapping("/controller")
    public ApiResponse<Regulator> createRegulator(
            @RequestParam int calibYear,
            @RequestParam String equipName,
            @RequestParam String zoneName,
            @RequestParam(required = false) BigDecimal stdTemp,
            @RequestParam(required = false) BigDecimal measTemp,
            @RequestParam String regUserName,
            @RequestParam(value = "h1Files", required = false) MultipartFile[] h1Files,
            @RequestParam(value = "h2Files", required = false) MultipartFile[] h2Files) {
        Regulator meta = new Regulator();
        meta.setCalibYear(calibYear);
        meta.setEquipName(equipName);
        meta.setZoneName(zoneName);
        meta.setStdTemp(stdTemp);
        meta.setMeasTemp(measTemp);
        meta.setRegUserName(regUserName);
        return ApiResponse.success(conditionService.createRegulator(meta, h1Files, h2Files));
    }

    @PutMapping("/controller/{id}")
    public ApiResponse<Regulator> updateRegulator(
            @PathVariable Long id,
            @RequestParam int calibYear,
            @RequestParam String equipName,
            @RequestParam String zoneName,
            @RequestParam(required = false) BigDecimal stdTemp,
            @RequestParam(required = false) BigDecimal measTemp,
            @RequestParam(value = "keepFileIds", required = false) List<Long> keepFileIds,
            @RequestParam(value = "h1Files", required = false) MultipartFile[] h1Files,
            @RequestParam(value = "h2Files", required = false) MultipartFile[] h2Files) {
        Regulator meta = new Regulator();
        meta.setCalibYear(calibYear);
        meta.setEquipName(equipName);
        meta.setZoneName(zoneName);
        meta.setStdTemp(stdTemp);
        meta.setMeasTemp(measTemp);
        return ApiResponse.success(conditionService.updateRegulator(id, meta, keepFileIds, h1Files, h2Files));
    }

    @PostMapping("/controller/delete")
    public ApiResponse<Void> deleteRegulators(@RequestBody List<Long> ids) {
        conditionService.deleteRegulators(ids);
        return ApiResponse.success();
    }

    @GetMapping("/controller/file/{fileId}")
    public ResponseEntity<Resource> getRegulatorFile(
            @PathVariable Long fileId,
            @RequestParam(defaultValue = "preview") String mode) throws IOException {
        RegulatorFile fileMeta = conditionService.getRegulatorFileMeta(fileId);
        Resource resource = conditionService.loadRegulatorFile(fileMeta.getFileName());
        String contentType = Files.probeContentType(resource.getFile().toPath());
        MediaType mediaType = contentType != null
                ? MediaType.parseMediaType(contentType)
                : MediaType.APPLICATION_OCTET_STREAM;
        ContentDisposition disposition = "download".equals(mode)
                ? ContentDisposition.attachment().filename(fileMeta.getOrigFileName(), StandardCharsets.UTF_8).build()
                : ContentDisposition.inline().build();
        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .body(resource);
    }

    @GetMapping("/oilAnalysis")
    public ApiResponse<List<OilAnalysis>> getOilAnalysisList(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String mchName) {
        return ApiResponse.success(conditionService.getOilAnalysisList(from, to, mchName));
    }

    @GetMapping("/oilAnalysis/mchNames")
    public ApiResponse<List<String>> getOilAnalysisMchNames() {
        return ApiResponse.success(conditionService.getOilAnalysisMchNames());
    }

    @GetMapping("/oilAnalysis/{id}")
    public ApiResponse<OilAnalysis> getOilAnalysisById(@PathVariable Long id) {
        return ApiResponse.success(conditionService.getOilAnalysisById(id));
    }

    @PostMapping("/oilAnalysis")
    public ApiResponse<OilAnalysis> createOilAnalysis(
            @RequestParam String crDate,
            @RequestParam String mchName,
            @RequestParam(required = false) String memo,
            @RequestParam(value = "box1", required = false) MultipartFile box1,
            @RequestParam(value = "box2", required = false) MultipartFile box2,
            @RequestParam(value = "box3", required = false) MultipartFile box3,
            @RequestParam(value = "box4", required = false) MultipartFile box4) {
        OilAnalysis meta = new OilAnalysis();
        meta.setCrDate(crDate);
        meta.setMchName(mchName);
        meta.setMemo(memo);
        return ApiResponse.success(conditionService.createOilAnalysis(meta, box1, box2, box3, box4));
    }

    @PutMapping("/oilAnalysis/{id}")
    public ApiResponse<OilAnalysis> updateOilAnalysis(
            @PathVariable Long id,
            @RequestParam String crDate,
            @RequestParam String mchName,
            @RequestParam(required = false) String memo,
            @RequestParam(value = "box1", required = false) MultipartFile box1,
            @RequestParam(value = "box2", required = false) MultipartFile box2,
            @RequestParam(value = "box3", required = false) MultipartFile box3,
            @RequestParam(value = "box4", required = false) MultipartFile box4) {
        OilAnalysis meta = new OilAnalysis();
        meta.setCrDate(crDate);
        meta.setMchName(mchName);
        meta.setMemo(memo);
        return ApiResponse.success(conditionService.updateOilAnalysis(id, meta, box1, box2, box3, box4));
    }

    @DeleteMapping("/oilAnalysis/{id}")
    public ApiResponse<Void> deleteOilAnalysis(@PathVariable Long id) {
        conditionService.deleteOilAnalysis(id);
        return ApiResponse.success();
    }

    @GetMapping("/oilAnalysis/{id}/file/{slot}")
    public ResponseEntity<Resource> getOilAnalysisFile(
            @PathVariable Long id,
            @PathVariable int slot,
            @RequestParam(defaultValue = "preview") String mode) throws IOException {
        OilAnalysis meta = conditionService.getOilAnalysisById(id);
        String fileName = oilAnalysisSlotFileName(meta, slot);
        String origFileName = oilAnalysisSlotOrigFileName(meta, slot);
        if (fileName == null || fileName.isBlank()) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "첨부된 파일이 없습니다.");
        }
        Resource resource = conditionService.loadOilAnalysisFile(fileName);
        String contentType = Files.probeContentType(resource.getFile().toPath());
        MediaType mediaType = contentType != null
                ? MediaType.parseMediaType(contentType)
                : MediaType.APPLICATION_OCTET_STREAM;
        ContentDisposition disposition = "download".equals(mode)
                ? ContentDisposition.attachment().filename(origFileName, StandardCharsets.UTF_8).build()
                : ContentDisposition.inline().build();
        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .body(resource);
    }

    private String oilAnalysisSlotFileName(OilAnalysis meta, int slot) {
        return switch (slot) {
            case 1 -> meta.getBox1FileName();
            case 2 -> meta.getBox2FileName();
            case 3 -> meta.getBox3FileName();
            case 4 -> meta.getBox4FileName();
            default -> throw new BusinessException(ErrorCode.INVALID_PARAMETER, "잘못된 첨부 슬롯입니다: " + slot);
        };
    }

    private String oilAnalysisSlotOrigFileName(OilAnalysis meta, int slot) {
        return switch (slot) {
            case 1 -> meta.getBox1OrigFileName();
            case 2 -> meta.getBox2OrigFileName();
            case 3 -> meta.getBox3OrigFileName();
            case 4 -> meta.getBox4OrigFileName();
            default -> throw new BusinessException(ErrorCode.INVALID_PARAMETER, "잘못된 첨부 슬롯입니다: " + slot);
        };
    }

    @PostMapping("/dailyCheck/list")
    public ApiResponse<List<DailyCheck>> getDailyCheckByYm(@RequestParam String ym) {
        return ApiResponse.success(conditionService.getDailyCheckByYm(ym));
    }

    @PostMapping("/dailyCheck/update")
    public ApiResponse<Void> updateDailyCheckField(
            @RequestParam Long cnt, @RequestParam String dField, @RequestParam String dValue) {
        conditionService.updateDailyCheckField(cnt, dField, dValue);
        return ApiResponse.success();
    }

    @PostMapping("/dailyCheck/insert")
    public ApiResponse<Void> insertDailyCheckRow(@RequestParam String ym) {
        conditionService.insertDailyCheckRow(ym);
        return ApiResponse.success();
    }

    @PostMapping("/dailyCheck/delete")
    public ApiResponse<Void> deleteDailyCheckRow(@RequestParam Long cnt) {
        conditionService.deleteDailyCheckRow(cnt);
        return ApiResponse.success();
    }

    @PostMapping("/dailyCheck/uploadImage")
    public ApiResponse<String> uploadDailyCheckImage(
            @RequestParam Long cnt, @RequestParam("file") MultipartFile file) {
        return ApiResponse.success(conditionService.saveDailyCheckImage(cnt, file));
    }

    @GetMapping("/dailyCheck/viewImage")
    public ResponseEntity<Resource> viewDailyCheckImage(@RequestParam String fileName) throws IOException {
        Resource resource = conditionService.loadDailyCheckImage(fileName);
        String contentType = Files.probeContentType(resource.getFile().toPath());
        return ResponseEntity.ok()
                .contentType(contentType != null ? MediaType.parseMediaType(contentType) : MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }

    @GetMapping("/standard")
    public ApiResponse<List<Standard>> getStandardList(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String keyword) {
        return ApiResponse.success(conditionService.getStandardList(category, keyword));
    }

    @PostMapping("/standard")
    public ApiResponse<Standard> createStandard(
            @RequestParam String docTitle,
            @RequestParam(defaultValue = "작업표준서") String docCategory,
            @RequestParam(required = false) String equipName,
            @RequestParam(required = false) String revNo,
            @RequestParam(required = false) String effectiveDate,
            @RequestParam(required = false) String remark,
            @RequestParam("file") MultipartFile file) {
        Standard meta = new Standard();
        meta.setDocTitle(docTitle);
        meta.setDocCategory(docCategory);
        meta.setEquipName(equipName);
        meta.setRevNo(revNo);
        meta.setEffectiveDate(effectiveDate);
        meta.setRemark(remark);
        return ApiResponse.success(conditionService.createStandard(meta, file));
    }

    @PutMapping("/standard/{id}")
    public ApiResponse<Void> updateStandard(
            @PathVariable Long id,
            @RequestParam String docTitle,
            @RequestParam(defaultValue = "작업표준서") String docCategory,
            @RequestParam(required = false) String equipName,
            @RequestParam(required = false) String revNo,
            @RequestParam(required = false) String effectiveDate,
            @RequestParam(required = false) String remark,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        Standard meta = new Standard();
        meta.setDocTitle(docTitle);
        meta.setDocCategory(docCategory);
        meta.setEquipName(equipName);
        meta.setRevNo(revNo);
        meta.setEffectiveDate(effectiveDate);
        meta.setRemark(remark);
        conditionService.updateStandardMeta(id, meta);
        if (file != null && !file.isEmpty()) {
            conditionService.updateStandardFile(id, file);
        }
        return ApiResponse.success();
    }

    @DeleteMapping("/standard/{id}")
    public ApiResponse<Void> deleteStandard(@PathVariable Long id) {
        conditionService.deleteStandard(id);
        return ApiResponse.success();
    }

    @GetMapping("/standard/{id}/file")
    public ResponseEntity<Resource> getStandardFile(
            @PathVariable Long id,
            @RequestParam(defaultValue = "preview") String mode) throws IOException {
        Standard standard = conditionService.getStandardById(id);
        Resource resource = conditionService.loadStandardFile(standard.getFileName());
        String contentType = Files.probeContentType(resource.getFile().toPath());
        MediaType mediaType = contentType != null
                ? MediaType.parseMediaType(contentType)
                : MediaType.APPLICATION_OCTET_STREAM;
        ContentDisposition disposition = "download".equals(mode)
                ? ContentDisposition.attachment().filename(standard.getOrigFileName(), StandardCharsets.UTF_8).build()
                : ContentDisposition.inline().build();
        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .body(resource);
    }

}
