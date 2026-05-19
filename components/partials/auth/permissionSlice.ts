"use client";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { MenuPermissionItem } from "@/lib/api/permission/menuPermissions.interface";

export interface PermissionState {
    menus: MenuPermissionItem[];
    isLoaded: boolean;   // true once permissions have been fetched
    isLoading: boolean;  // true while fetching
}

const initialState: PermissionState = {
    menus: [],
    isLoaded: false,
    isLoading: false,
};

export const permissionSlice = createSlice({
    name: "permission",
    initialState,
    reducers: {
        setPermissionsLoading: (state) => {
            state.isLoading = true;
            state.isLoaded = false;
        },
        setPermissions: (state, action: PayloadAction<MenuPermissionItem[]>) => {
            state.menus = action.payload;
            state.isLoaded = true;
            state.isLoading = false;
        },
        clearPermissions: (state) => {
            state.menus = [];
            state.isLoaded = false;
            state.isLoading = false;
        },
    },
});

export const { setPermissionsLoading, setPermissions, clearPermissions } =
    permissionSlice.actions;

/** Selector: returns only menus the user can view */
export const selectViewableMenuCodes = (state: { permission: PermissionState }) =>
    new Set(
        state.permission.menus
            .filter((m) => m.canView)
            .map((m) => m.menuCode)
    );

export default permissionSlice.reducer;
