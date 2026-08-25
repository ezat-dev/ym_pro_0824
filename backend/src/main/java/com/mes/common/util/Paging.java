package com.mes.common.util;

/**
 * 목록 조회 공통 페이징 계산. 도메인 클래스에 페이징 필드를 섞지 않기 위해
 * Controller/ServiceImpl에서 page, size를 원시 파라미터로 주고받고 이 유틸로 offset만 계산한다.
 */
public final class Paging {

    private Paging() {
    }

    public static int normalizePage(int page) {
        return page < 1 ? 1 : page;
    }

    public static int normalizeSize(int size) {
        return size < 1 ? 10 : size;
    }

    public static int offset(int page, int size) {
        return (normalizePage(page) - 1) * normalizeSize(size);
    }
}
