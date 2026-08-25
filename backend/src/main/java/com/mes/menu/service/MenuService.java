package com.mes.menu.service;

import java.util.List;

import com.mes.menu.domain.MenuGroup;

public interface MenuService {

    List<MenuGroup> getMenuTree();
}
