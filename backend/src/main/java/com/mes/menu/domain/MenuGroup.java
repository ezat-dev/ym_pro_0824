package com.mes.menu.domain;

import java.util.List;

public class MenuGroup {

    private final String category;
    private final String path;
    private final List<MenuItem> menus;

    public MenuGroup(String category, String path, List<MenuItem> menus) {
        this.category = category;
        this.path = path;
        this.menus = menus;
    }

    public String getCategory() {
        return category;
    }

    public String getPath() {
        return path;
    }

    public List<MenuItem> getMenus() {
        return menus;
    }
}
