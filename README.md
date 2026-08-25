# SMART MES

제조 현장 관리자용 MES 웹 시스템. Spring Boot(MyBatis) 백엔드 + React(Vite) 프론트엔드.

## 기술 스택

- Backend: Java 21, Spring Boot 3.5.x, MyBatis(수동 SqlSession + Dao/DaoImpl), MariaDB
- Frontend: React 18, Vite, React Router, Tabulator(테이블), Axios

## 폴더 구조

```
backend/    Spring Boot 프로젝트 (com.mes: controller/service/service.impl/dao/dao.impl/domain, 중분류당 1개 파일)
frontend/   React 프로젝트 (사이드바 메뉴 → 페이지 라우팅)
backend/sql/schema.sql   실사용 중인 테이블(base_user, base_auth, base_login_hist) DDL
```

## 백엔드 실행

DB 접속 정보는 커밋하지 않고 환경변수로 주입합니다. 실행 전에 아래 두 개는 필수로 설정해야 합니다.

```powershell
$env:DB_USERNAME = "root"
$env:DB_PASSWORD = "실제 비밀번호"
# 필요 시 기본값(192.168.1.19 / 3306 / db_ym_pro)과 다르면 아래도 설정
# $env:DB_HOST = "..."; $env:DB_PORT = "..."; $env:DB_NAME = "..."

cd backend
./gradlew bootRun
```

최초 1회, `backend/sql/schema.sql`을 대상 MariaDB에 실행해 테이블을 만들어야 합니다. 테이블이 없어도 서버 자체는 기동되지만(메뉴 트리 API 등은 DB 없이 동작) 사용자관리/사용자권한/로그인이력 API는 에러가 납니다.

기본 포트는 `9090`입니다(`application.yml`에서 변경 가능).

### 최초 관리자 계정 만들기

```bash
curl -X POST http://localhost:9090/api/base/user \
  -H "Content-Type: application/json" \
  -d '{"loginId":"admin","password":"admin1234","userName":"관리자","useYn":"Y"}'
```

## 프론트엔드 실행

```powershell
cd frontend
npm install
npm run dev
```

기본 포트는 `5051`입니다(`vite.config.js`). API 서버 주소는 `.env.example`을 참고해 `.env`로 복사 후 `VITE_API_BASE_URL`을 설정하세요(기본값은 `http://localhost:9090`).

## 현재 구현 범위

- 실제 DB 연동 + CRUD까지 완성: **사용자관리, 사용자권한(메뉴별 CRUD 권한부여), 로그인이력**, 로그인 화면
- 나머지 메뉴(거래처관리/제품관리/패턴관리 및 모니터링·생산관리·조건관리·품질관리·설비관리 전체)는 목록 조회 API만 있는 1단계 골격 상태
- 로그인은 되지만 "권한 없는 메뉴 접근 차단" 같은 강제 적용은 아직 없음(권한 데이터 저장/조회까지만 구현)
