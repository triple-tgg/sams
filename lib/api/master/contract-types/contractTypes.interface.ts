// Contract Type interfaces

export interface ContractTypeItem {
    id: number;
    code: string;
    name: string;
}

export interface ResContractType {
    message: string;
    responseData: ContractTypeItem[];
    error: string;
}
