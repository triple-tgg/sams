import axiosConfig from "@/lib/axios.config";
import { toEnglishTitle, toThaiTitle } from "@/lib/utils/personTitle";

/** Name title (คำนำหน้าชื่อ) master row, as embedded in staff records (`titleObj`). */
export interface StaffTitle {
    id: number;
    nameEn: string;
    nameTh: string;
    sortOrder: number;
    isdelete?: boolean;
    createddate?: string;
    createdby?: string | null;
    updateddate?: string | null;
    updatedby?: string | null;
}

export interface StaffTitleByIdResponse {
    message: string;
    responseData: StaffTitle | null;
    error: string;
}

export interface StaffTitleListResponse {
    message: string;
    responseData: StaffTitle[] | null;
    error: string;
}

/**
 * One name title
 * GET /master/titles/{id}
 */
export const getStaffTitleById = async (id: number): Promise<StaffTitle | null> => {
    try {
        const res = await axiosConfig.get(`/master/titles/${id}`);
        return (res.data as StaffTitleByIdResponse)?.responseData ?? null;
    } catch (error: any) {
        console.error("Error fetching title:", error);
        throw new Error(error?.response?.data?.error || error?.response?.data?.message || "Failed to fetch title");
    }
};

export interface UpsertStaffTitleRequest {
    /** 0 = create */
    id: number;
    nameTh: string;
    nameEn: string;
    sortOrder: number;
}

export interface UpsertStaffTitleResponse {
    message: string;
    /** The saved title */
    responseData: StaffTitle | null;
    error: string;
}

/**
 * Create (id 0) or update a name title
 * POST /master/titles/upsert
 */
export const upsertStaffTitle = async (data: UpsertStaffTitleRequest): Promise<UpsertStaffTitleResponse> => {
    try {
        const res = await axiosConfig.post("/master/titles/upsert", data);
        return res.data as UpsertStaffTitleResponse;
    } catch (error: any) {
        console.error("Error saving title:", error);
        throw new Error(error?.response?.data?.error || error?.response?.data?.message || "Failed to save title");
    }
};

export interface DeleteStaffTitleRequest {
    id: number;
}

export interface DeleteStaffTitleResponse {
    message: string;
    /** The deleted title (soft delete: isdelete = true) */
    responseData: StaffTitle | null;
    error: string;
}

/**
 * Delete a name title (soft delete)
 * POST /master/titles/delete
 */
export const deleteStaffTitle = async (data: DeleteStaffTitleRequest): Promise<DeleteStaffTitleResponse> => {
    try {
        const res = await axiosConfig.post("/master/titles/delete", data);
        return res.data as DeleteStaffTitleResponse;
    } catch (error: any) {
        console.error("Error deleting title:", error);
        throw new Error(error?.response?.data?.error || error?.response?.data?.message || "Failed to delete title");
    }
};

/** Active titles from the master, ordered by sortOrder. */
export function sortActiveTitles(titles: ReadonlyArray<StaffTitle>): StaffTitle[] {
    return titles.filter((t) => !t.isdelete).sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
}

/**
 * Name title master (คำนำหน้าชื่อ)
 * GET /master/titles/listdata
 */
export const getStaffTitles = async (): Promise<StaffTitle[]> => {
    try {
        const res = await axiosConfig.get("/master/titles/listdata");
        return sortActiveTitles((res.data as StaffTitleListResponse)?.responseData ?? []);
    } catch (error: any) {
        console.error("Error fetching titles:", error);
        throw new Error(error?.response?.data?.error || error?.response?.data?.message || "Failed to fetch titles");
    }
};

/**
 * Title id for a typed title ("Mr.", "นาย", "Miss", …). 0 when no title in the list matches.
 *
 * Exact names win over spelling variants, because two titles can share a Thai name
 * (Miss and Ms. are both "นางสาว"): "Ms." → Ms., "Miss" → Miss, "นางสาว" → the first by sortOrder.
 */
export function resolveStaffTitleId(text: string | null | undefined, titles: ReadonlyArray<StaffTitle>): number {
    if (!text?.trim()) return 0;
    const norm = (v: string) => v.trim().toLowerCase().replace(/\.$/, "");
    const raw = norm(text);
    const en = norm(toEnglishTitle(text));
    const th = norm(toThaiTitle(text));
    const match =
        titles.find((t) => norm(t.nameEn) === raw) ??
        titles.find((t) => norm(t.nameTh) === raw) ??
        titles.find((t) => norm(t.nameEn) === en) ??
        titles.find((t) => norm(t.nameTh) === th);
    return match?.id ?? 0;
}

/** "Mr." for display; falls back to the legacy free-text `title`. */
export function staffTitleText(staff: { titleObj?: StaffTitle | null; title?: string | null } | null | undefined): string {
    return staff?.titleObj?.nameEn || staff?.title || "";
}
