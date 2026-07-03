// Income Rule interfaces for Staff Income calculation

/**
 * Condition type for an income rule item
 * - none: No condition (always applies, e.g., License)
 * - exact: Exact match (e.g., exactly 1 rating)
 * - range: Comparison operator (e.g., >=2 ratings)
 */
export type ConditionType = 'none' | 'exact' | 'range';

/**
 * Comparison operator for range conditions
 */
export type ConditionOperator = '=' | '>=' | '<=' | '>' | '<';

/**
 * A single income rule item that defines one line of the calculation
 */
export interface IncomeRuleItem {
    id: number;
    itemName: string;
    category: string;          // e.g., "License", "Type Rating"
    conditionType: ConditionType;
    conditionOperator?: ConditionOperator;
    conditionValue?: number;
    amount: number;
    applyProRate: boolean;
    proRateBaseDays: number;   // default: 30
    isActive: boolean;
    sortOrder: number;
    createdDate?: string;
    createdBy?: string;
    updatedDate?: string;
    updatedBy?: string;
}

// ── List ──
export interface IncomeRuleListResponse {
    message: string;
    responseData: IncomeRuleItem[];
    error: string;
}

// ── Get by ID ──
export interface IncomeRuleByIdResponse {
    message: string;
    responseData: IncomeRuleItem;
    error: string;
}

// ── Upsert (Create / Update) ──
export interface IncomeRuleUpsertRequest {
    id: number;                // 0 for new, existing id for update
    itemName: string;
    category: string;
    conditionType: ConditionType;
    conditionOperator?: ConditionOperator;
    conditionValue?: number;
    amount: number;
    applyProRate: boolean;
    proRateBaseDays: number;
    isActive: boolean;
    sortOrder: number;
    userName: string;
}

export interface IncomeRuleUpsertResponse {
    message: string;
    responseData: IncomeRuleItem | null;
    error: string;
}

// ── Delete ──
export interface IncomeRuleDeleteRequest {
    id: number;
    userName: string;
}

export interface IncomeRuleDeleteResponse {
    message: string;
    responseData: null;
    error: string;
}

// ── Categories ──
export interface IncomeRuleCategoryOption {
    value: string;
    label: string;
}

/**
 * Predefined categories for income rule items.
 * Can be extended via backend in the future.
 */
export const INCOME_RULE_CATEGORIES: IncomeRuleCategoryOption[] = [
    { value: 'license', label: 'License' },
    { value: 'type_rating', label: 'Type Rating' },
];

/**
 * Display-friendly condition operator labels
 */
export const CONDITION_OPERATOR_LABELS: Record<ConditionOperator, string> = {
    '=': 'Equal (=)',
    '>=': 'Greater or Equal (≥)',
    '<=': 'Less or Equal (≤)',
    '>': 'Greater than (>)',
    '<': 'Less than (<)',
};
