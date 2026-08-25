package com.mes.domain.base;

/**
 * 권한부여 화면 1행: 메뉴 정보 + 해당 사용자의 CRUD 권한 체크 상태.
 * 메뉴 목록 자체는 DB가 아니라 menu 모듈의 하드코딩 트리에서 가져온다.
 */
public class AuthMenuItem {

    private String category;
    private String menuName;
    private String menuPath;
    private boolean canCreate;
    private boolean canRead;
    private boolean canUpdate;
    private boolean canDelete;

    public AuthMenuItem() {
    }

    public AuthMenuItem(String category, String menuName, String menuPath) {
        this.category = category;
        this.menuName = menuName;
        this.menuPath = menuPath;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getMenuName() {
        return menuName;
    }

    public void setMenuName(String menuName) {
        this.menuName = menuName;
    }

    public String getMenuPath() {
        return menuPath;
    }

    public void setMenuPath(String menuPath) {
        this.menuPath = menuPath;
    }

    public boolean isCanCreate() {
        return canCreate;
    }

    public void setCanCreate(boolean canCreate) {
        this.canCreate = canCreate;
    }

    public boolean isCanRead() {
        return canRead;
    }

    public void setCanRead(boolean canRead) {
        this.canRead = canRead;
    }

    public boolean isCanUpdate() {
        return canUpdate;
    }

    public void setCanUpdate(boolean canUpdate) {
        this.canUpdate = canUpdate;
    }

    public boolean isCanDelete() {
        return canDelete;
    }

    public void setCanDelete(boolean canDelete) {
        this.canDelete = canDelete;
    }
}
