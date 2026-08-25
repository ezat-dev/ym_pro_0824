package com.mes.menu.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mes.common.response.ApiResponse;
import com.mes.menu.domain.MenuGroup;
import com.mes.menu.service.MenuService;

@RestController
@RequestMapping("/api/menu")
public class MenuController {

    private final MenuService menuService;

    public MenuController(MenuService menuService) {
        this.menuService = menuService;
    }

    @GetMapping("/tree")
    public ApiResponse<List<MenuGroup>> getMenuTree() {
        return ApiResponse.success(menuService.getMenuTree());
    }
}
