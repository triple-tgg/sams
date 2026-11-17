import axiosConfig from "@/lib/axios.config";

// ──────────────────────────────────────────────────────────────
// Interfaces — /menu/*
// ──────────────────────────────────────────────────────────────

export interface MenuItem {
  id: number;
  menuCode: string;
  name: string;
  icon: string | null;
  route: string | null;
  /** null (or 0) = top level */
  parentId: number | null;
  sortOrder: number;
  isActive: boolean;
  isdelete?: boolean;
  createddate?: string | null;
  createdby?: string | null;
  updateddate?: string | null;
  updatedby?: string | null;
}

export interface MenuListResponse {
  message: string;
  responseData: MenuItem[] | null;
  error: string;
}

export interface MenuResponse {
  message: string;
  responseData: MenuItem | null;
  error: string;
}

export interface MenuUpsertRequest {
  id: number; // 0 = add, existing id = update
  menuCode: string;
  name: string;
  icon: string | null;
  route: string | null;
  parentId: number | null;
  sortOrder: number;
  isActive: boolean;
}

export interface MenuUpsertResponse {
  message: string;
  /** id of the saved menu */
  responseData: number | null;
  error: string;
}

const errorMessage = (error: any, fallback: string): string =>
  error?.response?.data?.error || error?.response?.data?.message || error?.message || fallback;

// ──────────────────────────────────────────────────────────────
// API Functions
// ──────────────────────────────────────────────────────────────

/** GET all menus (flat list) */
export const getMenuList = async (): Promise<MenuListResponse> => {
  try {
    const res = await axiosConfig.get("/menu/list");
    return res.data;
  } catch (error) {
    throw new Error(errorMessage(error, "Failed to load menus"));
  }
};

/** GET one menu by id */
export const getMenuById = async (id: number): Promise<MenuResponse> => {
  try {
    const res = await axiosConfig.get(`/menu/byid/${id}`);
    return res.data;
  } catch (error) {
    throw new Error(errorMessage(error, "Failed to load menu"));
  }
};

/** POST create (id = 0) or update a menu */
export const upsertMenu = async (data: MenuUpsertRequest): Promise<MenuUpsertResponse> => {
  try {
    const res = await axiosConfig.post("/menu/upsert", data);
    return res.data;
  } catch (error) {
    throw new Error(errorMessage(error, "Failed to save menu"));
  }
};

/** True when an upsert response means the save went through */
export const isMenuUpsertSuccess = (res?: MenuUpsertResponse | null): boolean =>
  !!res && !res.error && (res.message?.toLowerCase() === "success" || res.responseData != null);
