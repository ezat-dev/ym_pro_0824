package com.mes.controller;

import java.util.List;

import jakarta.servlet.http.HttpServletRequest;

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
import com.mes.domain.base.AuthMenuItem;
import com.mes.domain.base.LoginHist;
import com.mes.domain.base.LoginRequest;
import com.mes.domain.base.Pattern;
import com.mes.domain.base.Product;
import com.mes.domain.base.User;
import com.mes.domain.base.Vendor;
import com.mes.service.BaseService;

/**
 * 기준정보(base) 중분류 REST 엔드포인트.
 *
 * <p>이 프로젝트는 "중분류 1개당 컨트롤러 1개" 구조를 쓰기 때문에, 사용자관리 / 거래처관리 /
 * 제품관리 / 패턴관리 / 사용자권한 / 로그인이력 / 로그인 6개 메뉴·기능이 전부 이 클래스 하나에 모여 있다.
 * 실제 비즈니스 로직은 여기서 처리하지 않고 {@link BaseService}에 위임만 한다(Controller는 얇게 유지).</p>
 *
 * <p>현재 실제로 DB까지 붙어 동작하는 것은 사용자관리 / 사용자권한 / 로그인이력 / 로그인 4가지뿐이며,
 * 거래처관리 / 제품관리 / 패턴관리는 아직 목록 조회만 있는 1단계 골격 상태다.</p>
 */
@RestController
@RequestMapping("/api/base")
public class BaseController {

    private final BaseService baseService;

    public BaseController(BaseService baseService) {
        this.baseService = baseService;
    }

    // ===================== 사용자관리 (base_user) =====================

    /**
     * 사용자 목록을 페이지 단위로 조회한다.
     *
     * @param page    조회할 페이지 번호(1부터 시작). 생략 시 1페이지.
     * @param size    페이지당 건수. 생략 시 10건.
     * @param keyword 아이디/이름 부분 검색어. 생략하면 전체 조회.
     * @return 비밀번호는 항상 null로 마스킹된 사용자 목록 + 페이징 정보.
     */
    @GetMapping("/user")
    public ApiResponse<PageResponse<User>> getUserList(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword) {
        return ApiResponse.success(baseService.getUserList(page, size, keyword));
    }

    /**
     * 사용자를 신규 등록한다.
     *
     * <p>요청 바디의 password는 평문으로 받아 서버에서 BCrypt로 해시한 뒤 저장한다.
     * loginId 중복, 필수값 누락 시 {@link com.mes.common.exception.BusinessException}이 발생하며
     * {@link com.mes.common.exception.GlobalExceptionHandler}가 400 응답으로 변환한다.</p>
     *
     * @param user loginId, password, userName은 필수. deptName/phone/email/useYn은 선택.
     * @return 생성된 사용자(비밀번호 마스킹, 생성된 userId 포함).
     */
    @PostMapping("/user")
    public ApiResponse<User> createUser(@RequestBody User user) {
        return ApiResponse.success(baseService.createUser(user));
    }

    /**
     * 사용자 정보를 수정한다.
     *
     * <p>password 필드를 비워서 보내면(null 또는 빈 문자열) 기존 비밀번호를 그대로 유지하고,
     * 값이 있으면 새 비밀번호로 재해시하여 교체한다.</p>
     *
     * @param userId 수정 대상 사용자 PK (경로 변수)
     * @param user   변경할 값. userId는 경로 값으로 덮어써지므로 바디에 넣어도 무시된다.
     * @return 수정된 사용자(비밀번호 마스킹).
     */
    @PutMapping("/user/{userId}")
    public ApiResponse<User> updateUser(@PathVariable Long userId, @RequestBody User user) {
        return ApiResponse.success(baseService.updateUser(userId, user));
    }

    /**
     * 사용자를 삭제한다. 연결된 권한 부여 이력(base_auth)도 함께 정리한다.
     *
     * @param userId 삭제 대상 사용자 PK
     */
    @DeleteMapping("/user/{userId}")
    public ApiResponse<Void> deleteUser(@PathVariable Long userId) {
        baseService.deleteUser(userId);
        return ApiResponse.success();
    }

    // ===================== 거래처관리 / 제품관리 / 패턴관리 (1단계 골격, 조회만) =====================

    /** 거래처 목록 조회. 아직 목록 조회 API만 있는 1단계 상태(등록/수정/삭제 미구현). */
    @GetMapping("/vendor")
    public ApiResponse<PageResponse<Vendor>> getVendorList(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword) {
        return ApiResponse.success(baseService.getVendorList(page, size, keyword));
    }

    /** 제품 목록 조회. 아직 목록 조회 API만 있는 1단계 상태(등록/수정/삭제 미구현). */
    @GetMapping("/product")
    public ApiResponse<PageResponse<Product>> getProductList(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword) {
        return ApiResponse.success(baseService.getProductList(page, size, keyword));
    }

    /** 패턴 목록 조회. 아직 목록 조회 API만 있는 1단계 상태(등록/수정/삭제 미구현). */
    @GetMapping("/pattern")
    public ApiResponse<PageResponse<Pattern>> getPatternList(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword) {
        return ApiResponse.success(baseService.getPatternList(page, size, keyword));
    }

    // ===================== 사용자권한 (base_auth) =====================

    /**
     * 특정 사용자의 "메뉴별 CRUD 권한부여" 전체 그리드를 조회한다.
     *
     * <p>메뉴 목록 자체는 DB가 아니라 {@code menu} 모듈의 하드코딩된 트리(35개 메뉴)에서 가져오고,
     * 여기에 base_auth에 저장된 실제 권한값을 병합해서 돌려준다. 즉 응답은 항상 35행이며,
     * 한 번도 권한을 부여받은 적 없는 메뉴는 4개 플래그가 모두 false로 채워진다.</p>
     *
     * @param userId 권한을 조회할 사용자 PK
     * @return 카테고리/메뉴명/경로 + C·R·U·D 4개 boolean 플래그로 구성된 35행 리스트
     */
    @GetMapping("/auth/{userId}")
    public ApiResponse<List<AuthMenuItem>> getAuthMenuItems(@PathVariable Long userId) {
        return ApiResponse.success(baseService.getAuthMenuItems(userId));
    }

    /**
     * 특정 사용자의 메뉴별 권한 그리드를 통째로 저장한다.
     *
     * <p>부분 업데이트가 아니라 "해당 사용자의 기존 권한 전부 삭제 후 전달받은 리스트로 재삽입"하는
     * 방식이라, 화면에서 편집한 35행 전체를 그대로 보내야 한다(체크 안 한 항목도 포함해서 전송).</p>
     *
     * @param userId 권한을 저장할 사용자 PK
     * @param items  저장할 권한 그리드 전체(보통 {@link #getAuthMenuItems}로 받은 걸 수정해서 그대로 재전송)
     */
    @PutMapping("/auth/{userId}")
    public ApiResponse<Void> saveAuthMenuItems(@PathVariable Long userId, @RequestBody List<AuthMenuItem> items) {
        baseService.saveAuthMenuItems(userId, items);
        return ApiResponse.success();
    }

    // ===================== 로그인이력 (base_login_hist) =====================

    /**
     * 로그인 시도 이력을 페이지 단위로 조회한다(성공/실패 모두 포함).
     * 이력 row 자체는 이 API가 아니라 {@link #login} 호출 시 서버에서 자동으로 쌓인다.
     */
    @GetMapping("/loginHist")
    public ApiResponse<PageResponse<LoginHist>> getLoginHistList(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword) {
        return ApiResponse.success(baseService.getLoginHistList(page, size, keyword));
    }

    // ===================== 로그인 =====================

    /**
     * 로그인 화면에서 호출하는 로그인 처리 API.
     *
     * <p>아이디 존재 여부 → 계정 사용 여부(useYn) → 비밀번호 일치 여부 순서로 검증하고,
     * 성공/실패와 무관하게 매 시도마다 {@code base_login_hist}에 이력을 1건 남긴다.
     * 실패 시 {@link com.mes.common.exception.BusinessException}으로 400 응답이 나가며,
     * 어떤 항목이 틀렸는지는 보안상 응답 메시지에 노출하지 않고(이력 테이블의 failReason에만 기록)
     * 클라이언트에는 공통 문구("아이디 또는 비밀번호가 일치하지 않습니다.")만 내려준다.</p>
     *
     * <p>세션/토큰 발급은 아직 없다(1단계 범위 밖). 로그인 성공 시 사용자 정보만 반환하고,
     * 프론트엔드가 이를 브라우저에 보관해 "로그인한 것처럼" 화면을 유지하는 수준이다.</p>
     *
     * @param request       loginId, password
     * @param servletRequest 클라이언트 IP 추출용(로그인 이력에 기록)
     * @return 로그인 성공한 사용자 정보(비밀번호 마스킹)
     */
    @PostMapping("/login")
    public ApiResponse<User> login(@RequestBody LoginRequest request, HttpServletRequest servletRequest) {
        String clientIp = servletRequest.getRemoteAddr();
        return ApiResponse.success(baseService.login(request, clientIp));
    }

}
