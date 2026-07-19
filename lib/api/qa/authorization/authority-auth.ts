import axiosConfig from "@/lib/axios.config";

export interface AuthorityAuthResponse {
  message: string;
  responseData: {
    authorities: Array<{
      aviationAuthorityId: number;
      code: string;
      name: string;
    }>;
    staffRows: Array<{
      staffId: number;
      staffName: string;
      employeeId: string;
      profileImagePath: string | null;
      licenses: Array<{
        authorityId: number;
        aviationAuthorityId: number;
        authorityCode: string;
        currentIssueDate: string | null;
        expireDate: string | null;
        status: string;
        aviationAuthorityLicense: any | null;
        aviationAuthorityLicenseAircrafts: any[] | null;
      }>;
    }>;
  };
}

export const getAuthorityAuthList = async () => {
  const res = await axiosConfig.post<AuthorityAuthResponse>("/authorization/authority/listdata", {});
  return res.data;
};
