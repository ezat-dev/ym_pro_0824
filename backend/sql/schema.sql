-- MariaDB 기준. db_ym_pro 스키마에 실행.
-- 사용자관리 / 사용자권한 / 로그인이력 3개 메뉴가 실제로 사용하는 테이블.
-- (나머지 메뉴는 아직 1단계 골격이라 테이블이 없어도 목록 조회 API가 빈 값을 반환)

CREATE DATABASE IF NOT EXISTS db_ym_pro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE db_ym_pro;

CREATE TABLE IF NOT EXISTS base_user (
    user_id     BIGINT AUTO_INCREMENT PRIMARY KEY,
    login_id    VARCHAR(50)  NOT NULL,
    password    VARCHAR(255) NOT NULL,
    user_name   VARCHAR(50)  NOT NULL,
    dept_name   VARCHAR(50)  NULL,
    phone       VARCHAR(20)  NULL,
    email       VARCHAR(100) NULL,
    use_yn      CHAR(1) NOT NULL DEFAULT 'Y',
    reg_dt      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    upd_dt      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_base_user_login_id (login_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS base_auth (
    auth_id     BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    menu_path   VARCHAR(100) NOT NULL,
    can_create  TINYINT(1) NOT NULL DEFAULT 0,
    can_read    TINYINT(1) NOT NULL DEFAULT 0,
    can_update  TINYINT(1) NOT NULL DEFAULT 0,
    can_delete  TINYINT(1) NOT NULL DEFAULT 0,
    reg_dt      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    upd_dt      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_base_auth_user_menu (user_id, menu_path),
    CONSTRAINT fk_base_auth_user FOREIGN KEY (user_id) REFERENCES base_user(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS base_login_hist (
    history_id   BIGINT AUTO_INCREMENT PRIMARY KEY,
    login_id     VARCHAR(50) NOT NULL,
    user_name    VARCHAR(50) NULL,
    login_ip     VARCHAR(50) NULL,
    success_yn   CHAR(1) NOT NULL,
    fail_reason  VARCHAR(200) NULL,
    login_dt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
