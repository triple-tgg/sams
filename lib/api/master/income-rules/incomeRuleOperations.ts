/**
 * Income Rule Operations — Mock API layer
 *
 * Uses localStorage to persist rules across page refreshes.
 * When the backend API is ready, swap the implementations here
 * and the React Query hooks will work without changes.
 */
import type {
    IncomeRuleItem,
    IncomeRuleListResponse,
    IncomeRuleByIdResponse,
    IncomeRuleUpsertRequest,
    IncomeRuleUpsertResponse,
    IncomeRuleDeleteRequest,
    IncomeRuleDeleteResponse,
} from "./income-rules.interface";

const STORAGE_KEY = "sam_income_rules";

// ── Seed data matching the flowchart example ──
const SEED_DATA: IncomeRuleItem[] = [
    {
        id: 1,
        itemName: "License",
        category: "license",
        conditionType: "none",
        amount: 5000,
        applyProRate: false,
        proRateBaseDays: 30,
        isActive: true,
        sortOrder: 1,
        createdDate: new Date().toISOString(),
        createdBy: "system",
    },
    {
        id: 2,
        itemName: "Type Rating (1 Rating)",
        category: "type_rating",
        conditionType: "exact",
        conditionOperator: "=",
        conditionValue: 1,
        amount: 3000,
        applyProRate: false,
        proRateBaseDays: 30,
        isActive: true,
        sortOrder: 2,
        createdDate: new Date().toISOString(),
        createdBy: "system",
    },
    {
        id: 3,
        itemName: "Type Rating (≥2 Ratings)",
        category: "type_rating",
        conditionType: "range",
        conditionOperator: ">=",
        conditionValue: 2,
        amount: 5000,
        applyProRate: false,
        proRateBaseDays: 30,
        isActive: true,
        sortOrder: 3,
        createdDate: new Date().toISOString(),
        createdBy: "system",
    },
];

// ── Local storage helpers ──
function loadRules(): IncomeRuleItem[] {
    if (typeof window === "undefined") return SEED_DATA;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
            return SEED_DATA;
        }
        return JSON.parse(raw) as IncomeRuleItem[];
    } catch {
        return SEED_DATA;
    }
}

function saveRules(rules: IncomeRuleItem[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
}

// Simulate async delay
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── API-shaped functions ──

/**
 * Get all income rules
 */
export const getIncomeRuleList = async (): Promise<IncomeRuleListResponse> => {
    await delay(300);
    const rules = loadRules();
    return {
        message: "success",
        responseData: rules.sort((a, b) => a.sortOrder - b.sortOrder),
        error: "",
    };
};

/**
 * Get income rule by ID
 */
export const getIncomeRuleById = async (id: number): Promise<IncomeRuleByIdResponse> => {
    await delay(200);
    const rules = loadRules();
    const rule = rules.find((r) => r.id === id);
    if (!rule) throw new Error("Income rule not found");
    return {
        message: "success",
        responseData: rule,
        error: "",
    };
};

/**
 * Create or update an income rule
 */
export const upsertIncomeRule = async (
    data: IncomeRuleUpsertRequest
): Promise<IncomeRuleUpsertResponse> => {
    await delay(400);
    const rules = loadRules();
    const now = new Date().toISOString();

    if (data.id === 0) {
        // Create
        const newId = rules.length > 0 ? Math.max(...rules.map((r) => r.id)) + 1 : 1;
        const newRule: IncomeRuleItem = {
            id: newId,
            itemName: data.itemName,
            category: data.category,
            conditionType: data.conditionType,
            conditionOperator: data.conditionOperator,
            conditionValue: data.conditionValue,
            amount: data.amount,
            applyProRate: data.applyProRate,
            proRateBaseDays: data.proRateBaseDays,
            isActive: data.isActive,
            sortOrder: data.sortOrder || rules.length + 1,
            createdDate: now,
            createdBy: data.userName,
        };
        rules.push(newRule);
        saveRules(rules);
        return { message: "success", responseData: newRule, error: "" };
    } else {
        // Update
        const idx = rules.findIndex((r) => r.id === data.id);
        if (idx === -1) throw new Error("Income rule not found");
        rules[idx] = {
            ...rules[idx],
            itemName: data.itemName,
            category: data.category,
            conditionType: data.conditionType,
            conditionOperator: data.conditionOperator,
            conditionValue: data.conditionValue,
            amount: data.amount,
            applyProRate: data.applyProRate,
            proRateBaseDays: data.proRateBaseDays,
            isActive: data.isActive,
            sortOrder: data.sortOrder,
            updatedDate: now,
            updatedBy: data.userName,
        };
        saveRules(rules);
        return { message: "success", responseData: rules[idx], error: "" };
    }
};

/**
 * Delete an income rule
 */
export const deleteIncomeRule = async (
    data: IncomeRuleDeleteRequest
): Promise<IncomeRuleDeleteResponse> => {
    await delay(300);
    let rules = loadRules();
    rules = rules.filter((r) => r.id !== data.id);
    saveRules(rules);
    return { message: "success", responseData: null, error: "" };
};
