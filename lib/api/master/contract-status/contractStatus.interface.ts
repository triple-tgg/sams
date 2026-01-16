// Contract Status interfaces

export interface ContractStatusItem {
    id: number;
    code: string;
    name: string;
}

export interface ResContractStatus {
    message: string;
    responseData: ContractStatusItem[];
    error: string;
}
