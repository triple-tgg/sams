export enum CurrencyType {
    THB = "THB",
    USD = "USD",
}

export interface CurrencyOption {
    value: CurrencyType;
    label: string;
}

export const CURRENCY_OPTIONS: CurrencyOption[] = [
    { value: CurrencyType.THB, label: "THB" },
    { value: CurrencyType.USD, label: "USD" },
];

export const CURRENCY_VALUES: CurrencyType[] = CURRENCY_OPTIONS.map((opt) => opt.value);

export const normalizeCurrency = (value?: string | null): string =>
    value?.trim().toUpperCase() || "";

