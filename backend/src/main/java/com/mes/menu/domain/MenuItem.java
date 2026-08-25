package com.mes.menu.domain;

public class MenuItem {

    private final String name;
    private final String path;

    public MenuItem(String name, String path) {
        this.name = name;
        this.path = path;
    }

    public String getName() {
        return name;
    }

    public String getPath() {
        return path;
    }
}
