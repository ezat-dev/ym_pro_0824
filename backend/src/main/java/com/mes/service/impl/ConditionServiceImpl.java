package com.mes.service.impl;

import java.io.IOException;
import java.math.BigDecimal;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.mes.common.exception.BusinessException;
import com.mes.common.exception.ErrorCode;
import com.mes.dao.ConditionDao;
import com.mes.domain.condition.Sensor;
import com.mes.domain.condition.Regulator;
import com.mes.domain.condition.RegulatorFile;
import com.mes.domain.condition.OilAnalysis;
import com.mes.domain.condition.DailyCheck;
import com.mes.domain.condition.Standard;
import com.mes.service.ConditionService;

@Service
@Transactional(readOnly = true)
public class ConditionServiceImpl implements ConditionService {

    // 일상점검일지 동적 컬럼 UPDATE 화이트리스트 — 여기 없는 dField는 절대 SQL에 넣지 않는다.
    private static final Set<String> DAILY_CHECK_EDITABLE_FIELDS = Set.of(
            "d_title", "d_desc", "d_bigo", "value_type",
            "d01", "d02", "d03", "d04", "d05", "d06", "d07", "d08", "d09", "d10",
            "d11", "d12", "d13", "d14", "d15", "d16", "d17", "d18", "d19", "d20",
            "d21", "d22", "d23", "d24", "d25", "d26", "d27", "d28", "d29", "d30", "d31");

    private static final Set<String> DAILY_CHECK_VALUE_TYPES = Set.of("check", "number", "text");

    private final ConditionDao conditionDao;

    @Value("${app.upload-dir}")
    private String uploadDir;

    @Value("${app.standard-upload-dir}")
    private String standardUploadDir;

    @Value("${app.controller-upload-dir}")
    private String controllerUploadDir;

    @Value("${app.oilAnalysis-upload-dir}")
    private String oilAnalysisUploadDir;

    public ConditionServiceImpl(ConditionDao conditionDao) {
        this.conditionDao = conditionDao;
    }

    @Override
    public List<Sensor> getSensorList(int year, String sensorType) {
        return conditionDao.selectSensorList(year, sensorType);
    }

    @Override
    @Transactional
    public void createSensor(Sensor sensor) {
        conditionDao.insertSensor(sensor);
    }

    @Override
    @Transactional
    public void updateSensor(Sensor sensor) {
        conditionDao.updateSensor(sensor);
    }

    @Override
    @Transactional
    public void deleteSensors(List<Long> ids) {
        for (Long id : ids) {
            conditionDao.softDeleteSensor(id);
        }
    }

    @Override
    public List<Regulator> getRegulatorList(int calibYear, String equipName) {
        return conditionDao.selectRegulatorList(calibYear, equipName);
    }

    @Override
    public List<String> getRegulatorEquipNames() {
        return conditionDao.selectRegulatorEquipNames();
    }

    @Override
    public Regulator getRegulatorById(Long id) {
        Regulator regulator = conditionDao.selectRegulatorById(id);
        if (regulator == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "정도검사 기록을 찾을 수 없습니다.");
        }
        List<RegulatorFile> files = conditionDao.selectRegulatorFilesByControllerId(id);
        regulator.setH1Files(files.stream().filter(f -> "H1".equals(f.getHalf())).toList());
        regulator.setH2Files(files.stream().filter(f -> "H2".equals(f.getHalf())).toList());
        return regulator;
    }

    @Override
    @Transactional
    public Regulator createRegulator(Regulator meta, MultipartFile[] h1Files, MultipartFile[] h2Files) {
        meta.setDeviation(computeDeviation(meta.getStdTemp(), meta.getMeasTemp()));
        conditionDao.insertRegulator(meta);
        storeNewControllerFiles(meta.getId(), "H1", h1Files);
        storeNewControllerFiles(meta.getId(), "H2", h2Files);
        return getRegulatorById(meta.getId());
    }

    @Override
    @Transactional
    public Regulator updateRegulator(Long id, Regulator meta, List<Long> keepFileIds,
            MultipartFile[] h1Files, MultipartFile[] h2Files) {
        Regulator existing = getRegulatorById(id);
        meta.setId(id);
        meta.setDeviation(computeDeviation(meta.getStdTemp(), meta.getMeasTemp()));
        conditionDao.updateRegulatorMeta(meta);

        // 새 파일부터 저장 — 여기서 실패하면 예외로 트랜잭션이 롤백되고 기존 파일은 전혀 건드리지 않는다.
        storeNewControllerFiles(id, "H1", h1Files);
        storeNewControllerFiles(id, "H2", h2Files);

        // keepFileIds에 없는 기존 파일만 제거 대상으로 확정한다.
        Set<Long> keep = keepFileIds == null ? Set.of() : new HashSet<>(keepFileIds);
        List<RegulatorFile> allExisting = new ArrayList<>();
        allExisting.addAll(existing.getH1Files());
        allExisting.addAll(existing.getH2Files());
        List<RegulatorFile> toDelete = allExisting.stream().filter(f -> !keep.contains(f.getId())).toList();

        // DB 행을 먼저 지운다 — 최악의 경우도 "DB엔 없는데 파일만 남는" 무해한 상태로 끝나야 하므로
        // (반대 순서면 "DB엔 있는데 파일이 없는" 깨진 참조가 생긴다).
        for (RegulatorFile f : toDelete) {
            conditionDao.deleteRegulatorFile(f.getId());
        }
        for (RegulatorFile f : toDelete) {
            try {
                Files.deleteIfExists(Paths.get(controllerUploadDir).resolve(f.getFileName()));
            } catch (IOException ignored) {
                // 이전 파일 삭제 실패는 수정 자체를 막을 이유가 아니므로 무시한다.
            }
        }
        return getRegulatorById(id);
    }

    @Override
    @Transactional
    public void deleteRegulators(List<Long> ids) {
        for (Long id : ids) {
            conditionDao.softDeleteRegulator(id);
        }
    }

    @Override
    public RegulatorFile getRegulatorFileMeta(Long fileId) {
        RegulatorFile file = conditionDao.selectRegulatorFileById(fileId);
        if (file == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "파일을 찾을 수 없습니다.");
        }
        return file;
    }

    @Override
    public Resource loadRegulatorFile(String fileName) {
        String safeName = Paths.get(fileName).getFileName().toString();
        Path target = Paths.get(controllerUploadDir).resolve(safeName);
        if (!Files.exists(target)) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "파일을 찾을 수 없습니다.");
        }
        try {
            return new UrlResource(target.toUri());
        } catch (MalformedURLException e) {
            throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR, "파일을 읽을 수 없습니다.");
        }
    }

    private BigDecimal computeDeviation(BigDecimal stdTemp, BigDecimal measTemp) {
        if (stdTemp == null || measTemp == null) {
            return null;
        }
        return measTemp.subtract(stdTemp);
    }

    private void storeNewControllerFiles(Long controllerId, String half, MultipartFile[] files) {
        if (files == null) {
            return;
        }
        int index = 0;
        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) {
                continue;
            }
            String original = originalFileName(file);
            String ext = original.contains(".") ? original.substring(original.lastIndexOf('.')) : "";
            String newFileName = controllerId + "_" + half.toLowerCase()
                    + "_" + System.currentTimeMillis() + "_" + index + ext;
            try {
                Path dir = Paths.get(controllerUploadDir);
                Files.createDirectories(dir);
                file.transferTo(dir.resolve(newFileName));
            } catch (IOException e) {
                throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR, "파일 저장에 실패했습니다.");
            }
            RegulatorFile fileRow = new RegulatorFile();
            fileRow.setControllerId(controllerId);
            fileRow.setHalf(half);
            fileRow.setFileName(newFileName);
            fileRow.setOrigFileName(original);
            fileRow.setFileSize(file.getSize());
            conditionDao.insertRegulatorFile(fileRow);
            index++;
        }
    }

    @Override
    public List<OilAnalysis> getOilAnalysisList(String from, String to, String mchName) {
        return conditionDao.selectOilAnalysisList(from, to, mchName);
    }

    @Override
    public List<String> getOilAnalysisMchNames() {
        return conditionDao.selectOilAnalysisMchNames();
    }

    @Override
    public OilAnalysis getOilAnalysisById(Long id) {
        OilAnalysis oilAnalysis = conditionDao.selectOilAnalysisById(id);
        if (oilAnalysis == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "성상분석 기록을 찾을 수 없습니다.");
        }
        return oilAnalysis;
    }

    @Override
    @Transactional
    public OilAnalysis createOilAnalysis(OilAnalysis meta, MultipartFile box1, MultipartFile box2,
            MultipartFile box3, MultipartFile box4) {
        validateOilAnalysisMeta(meta);
        validatePdf(box1);
        validatePdf(box2);
        validatePdf(box3);
        validatePdf(box4);
        conditionDao.insertOilAnalysis(meta);
        storeOilAnalysisSlot(meta.getId(), 1, box1);
        storeOilAnalysisSlot(meta.getId(), 2, box2);
        storeOilAnalysisSlot(meta.getId(), 3, box3);
        storeOilAnalysisSlot(meta.getId(), 4, box4);
        return conditionDao.selectOilAnalysisById(meta.getId());
    }

    @Override
    @Transactional
    public OilAnalysis updateOilAnalysis(Long id, OilAnalysis meta, MultipartFile box1, MultipartFile box2,
            MultipartFile box3, MultipartFile box4) {
        OilAnalysis existing = getOilAnalysisById(id);
        validateOilAnalysisMeta(meta);
        validatePdf(box1);
        validatePdf(box2);
        validatePdf(box3);
        validatePdf(box4);
        meta.setId(id);
        conditionDao.updateOilAnalysisMeta(meta);
        replaceOilAnalysisSlot(id, 1, box1, existing.getBox1FileName());
        replaceOilAnalysisSlot(id, 2, box2, existing.getBox2FileName());
        replaceOilAnalysisSlot(id, 3, box3, existing.getBox3FileName());
        replaceOilAnalysisSlot(id, 4, box4, existing.getBox4FileName());
        return conditionDao.selectOilAnalysisById(id);
    }

    @Override
    @Transactional
    public void deleteOilAnalysis(Long id) {
        conditionDao.softDeleteOilAnalysis(id);
    }

    @Override
    public Resource loadOilAnalysisFile(String fileName) {
        String safeName = Paths.get(fileName).getFileName().toString();
        Path target = Paths.get(oilAnalysisUploadDir).resolve(safeName);
        if (!Files.exists(target)) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "파일을 찾을 수 없습니다.");
        }
        try {
            return new UrlResource(target.toUri());
        } catch (MalformedURLException e) {
            throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR, "파일을 읽을 수 없습니다.");
        }
    }

    private void validateOilAnalysisMeta(OilAnalysis meta) {
        if (meta.getCrDate() == null || meta.getCrDate().isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_PARAMETER, "채취일을 입력해주세요.");
        }
        if (meta.getMchName() == null || meta.getMchName().isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_PARAMETER, "설비명을 입력해주세요.");
        }
    }

    private void validatePdf(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return;
        }
        String original = originalFileName(file).toLowerCase();
        if (!original.endsWith(".pdf")) {
            throw new BusinessException(ErrorCode.INVALID_PARAMETER,
                    "업로드 파일은 PDF 형식만 가능합니다: " + originalFileName(file));
        }
    }

    /** slot(1~4)을 서비스 계층에서만 "box{n}_" 컬럼 접두어로 화이트리스트 변환한다 — 매퍼의 ${boxPrefix}에는
     *  이 메서드가 만든 값만 들어가므로 클라이언트가 임의 문자열로 SQL을 조작할 수 없다. */
    private String boxPrefix(int slot) {
        if (slot < 1 || slot > 4) {
            throw new BusinessException(ErrorCode.INVALID_PARAMETER, "잘못된 첨부 슬롯입니다: " + slot);
        }
        return "box" + slot + "_";
    }

    private void storeOilAnalysisSlot(Long id, int slot, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return;
        }
        String newFileName = saveOilAnalysisFileToDisk(id, slot, file);
        conditionDao.updateOilAnalysisBoxFile(id, boxPrefix(slot), newFileName, originalFileName(file), file.getSize());
    }

    private void replaceOilAnalysisSlot(Long id, int slot, MultipartFile file, String oldFileName) {
        if (file == null || file.isEmpty()) {
            return;
        }
        String newFileName = saveOilAnalysisFileToDisk(id, slot, file);
        conditionDao.updateOilAnalysisBoxFile(id, boxPrefix(slot), newFileName, originalFileName(file), file.getSize());
        // 새 파일 저장/DB갱신에 성공한 뒤에만 이전 물리 파일을 지운다 — 실패는 무시(고아 파일 방지보다 원본 보존이 우선).
        if (oldFileName != null && !oldFileName.isBlank()) {
            try {
                Files.deleteIfExists(Paths.get(oilAnalysisUploadDir).resolve(oldFileName));
            } catch (IOException ignored) {
                // 이전 파일 삭제 실패는 수정 자체를 막을 이유가 아니므로 무시한다.
            }
        }
    }

    private String saveOilAnalysisFileToDisk(Long id, int slot, MultipartFile file) {
        String original = originalFileName(file);
        String ext = original.contains(".") ? original.substring(original.lastIndexOf('.')) : "";
        String newFileName = id + "_box" + slot + "_" + System.currentTimeMillis() + ext;
        try {
            Path dir = Paths.get(oilAnalysisUploadDir);
            Files.createDirectories(dir);
            file.transferTo(dir.resolve(newFileName));
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR, "파일 저장에 실패했습니다.");
        }
        return newFileName;
    }

    @Override
    @Transactional
    public List<DailyCheck> getDailyCheckByYm(String ym) {
        if (ym == null || ym.isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_PARAMETER, "조회할 년월을 입력해주세요.");
        }
        if (conditionDao.countDailyCheckByYm(ym) == 0) {
            conditionDao.seedDailyCheckMonth(ym);
        }
        return conditionDao.selectDailyCheckByYm(ym);
    }

    @Override
    @Transactional
    public void updateDailyCheckField(Long cnt, String dField, String dValue) {
        if (!DAILY_CHECK_EDITABLE_FIELDS.contains(dField)) {
            throw new BusinessException(ErrorCode.INVALID_PARAMETER, "수정할 수 없는 필드입니다: " + dField);
        }
        if ("value_type".equals(dField) && !DAILY_CHECK_VALUE_TYPES.contains(dValue)) {
            throw new BusinessException(ErrorCode.INVALID_PARAMETER, "잘못된 입력 타입입니다: " + dValue);
        }
        conditionDao.updateDailyCheckField(cnt, dField, dValue);
    }

    @Override
    @Transactional
    public void insertDailyCheckRow(String ym) {
        if (ym == null || ym.isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_PARAMETER, "년월을 입력해주세요.");
        }
        conditionDao.insertDailyCheckRow(ym);
    }

    @Override
    @Transactional
    public void deleteDailyCheckRow(Long cnt) {
        conditionDao.softDeleteDailyCheck(cnt);
    }

    @Override
    @Transactional
    public String saveDailyCheckImage(Long cnt, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.INVALID_PARAMETER, "첨부할 파일이 없습니다.");
        }
        String original = file.getOriginalFilename() == null ? "" : file.getOriginalFilename();
        // 원본 파일명은 저장에 쓰지 않는다(경로 조작 방지) — 확장자만 취해 새 파일명을 만든다.
        String ext = original.contains(".") ? original.substring(original.lastIndexOf('.')) : "";
        String newFileName = cnt + "_" + System.currentTimeMillis() + ext;
        try {
            Path dir = Paths.get(uploadDir);
            Files.createDirectories(dir);
            file.transferTo(dir.resolve(newFileName));
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR, "파일 저장에 실패했습니다.");
        }
        conditionDao.updateDailyCheckImage(cnt, newFileName);
        return newFileName;
    }

    @Override
    public Resource loadDailyCheckImage(String fileName) {
        // 사용자 입력 파일명에서 경로 구분자를 모두 제거해 업로드 디렉토리 밖 파일 접근을 막는다.
        String safeName = Paths.get(fileName).getFileName().toString();
        Path target = Paths.get(uploadDir).resolve(safeName);
        if (!Files.exists(target)) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "파일을 찾을 수 없습니다.");
        }
        try {
            return new UrlResource(target.toUri());
        } catch (MalformedURLException e) {
            throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR, "파일을 읽을 수 없습니다.");
        }
    }

    @Override
    public List<Standard> getStandardList(String category, String keyword) {
        return conditionDao.selectStandardList(category, keyword);
    }

    @Override
    public Standard getStandardById(Long id) {
        Standard standard = conditionDao.selectStandardById(id);
        if (standard == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "문서를 찾을 수 없습니다.");
        }
        return standard;
    }

    @Override
    @Transactional
    public Standard createStandard(Standard meta, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.INVALID_PARAMETER, "첨부할 파일이 없습니다.");
        }
        conditionDao.insertStandard(meta);
        String newFileName = storeStandardFile(meta.getId(), file);
        conditionDao.updateStandardFile(meta.getId(), newFileName, originalFileName(file), file.getSize());
        return conditionDao.selectStandardById(meta.getId());
    }

    @Override
    @Transactional
    public void updateStandardMeta(Long id, Standard meta) {
        Standard existing = getStandardById(id);
        meta.setId(existing.getId());
        conditionDao.updateStandardMeta(meta);
    }

    @Override
    @Transactional
    public void updateStandardFile(Long id, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.INVALID_PARAMETER, "첨부할 파일이 없습니다.");
        }
        Standard existing = getStandardById(id);
        String newFileName = storeStandardFile(id, file);
        conditionDao.updateStandardFile(id, newFileName, originalFileName(file), file.getSize());
        // 새 파일 저장에 성공한 뒤에만 이전 물리 파일을 지운다 — 고아 파일 대신 교체 실패 시 원본 보존.
        if (existing.getFileName() != null && !existing.getFileName().isBlank()) {
            try {
                Files.deleteIfExists(Paths.get(standardUploadDir).resolve(existing.getFileName()));
            } catch (IOException ignored) {
                // 이전 파일 삭제 실패는 신규 등록 자체를 막을 이유가 아니므로 무시한다.
            }
        }
    }

    @Override
    @Transactional
    public void deleteStandard(Long id) {
        conditionDao.softDeleteStandard(id);
    }

    @Override
    public Resource loadStandardFile(String fileName) {
        String safeName = Paths.get(fileName).getFileName().toString();
        Path target = Paths.get(standardUploadDir).resolve(safeName);
        if (!Files.exists(target)) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "파일을 찾을 수 없습니다.");
        }
        try {
            return new UrlResource(target.toUri());
        } catch (MalformedURLException e) {
            throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR, "파일을 읽을 수 없습니다.");
        }
    }

    private String storeStandardFile(Long id, MultipartFile file) {
        String ext = originalFileName(file).contains(".")
                ? originalFileName(file).substring(originalFileName(file).lastIndexOf('.'))
                : "";
        String newFileName = id + "_" + System.currentTimeMillis() + ext;
        try {
            Path dir = Paths.get(standardUploadDir);
            Files.createDirectories(dir);
            file.transferTo(dir.resolve(newFileName));
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR, "파일 저장에 실패했습니다.");
        }
        return newFileName;
    }

    private String originalFileName(MultipartFile file) {
        return file.getOriginalFilename() == null ? "" : file.getOriginalFilename();
    }

}
