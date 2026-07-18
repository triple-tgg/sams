import axiosConfig from "@/lib/axios.config";

export interface CourseListRequest {
  categoryId: number | null;
  courseName: string;
  courseDepartmentRequirementId: number | null;
  page: number;
  perPage: number;
}

export interface CourseCategory {
  id: number;
  code: string;
  name: string;
  description: string | null;
  isdelete: boolean;
  createddate: string;
  createdby: string;
  updateddate: string;
  updatedby: string;
}

export interface CourseRequirementItem {
  id: number;
  courseId: number;
  courseDepartmentSubId: number;
  isRequired: boolean;
  isdelete: boolean;
  createddate: string;
  createdby: string | null;
  updateddate: string | null;
  updatedby: string | null;
}

export interface CourseData {
  id: number;
  courseCode: string;
  courseName: string;
  courseCategory: CourseCategory;
  courseType: string;
  recurrenceIntervalYears: number | null;
  additionalNote: string | null;
  createddate: string;
  createdby: string | null;
  updateddate: string | null;
  updatedby: string | null;
  aircraftTypeLicenseId: number | null;
  courseObjective: string | null;
  requirements: CourseRequirementItem[];
}

export interface CourseListResponseData {
  message: string;
  responseData: CourseData[];
  page: number;
  perPage: number;
  total: number;
  totalAll: number;
  error: string;
}

export const getCourseList = async (data: CourseListRequest): Promise<CourseListResponseData> => {
  try {
    const res = await axiosConfig.post("/training/course/listdata", data);
    return res.data as CourseListResponseData;
  } catch (error: any) {
    console.error("Error fetching course list:", error);
    throw new Error(error?.response?.data?.error || error?.response?.data?.message || "Failed to fetch course list");
  }
};

export interface UpsertCourseRequirement {
  courseId: number;
  courseDepartmentSubId: number;
  isRequired: boolean;
  userName: string;
}

export interface UpsertCourseRequest {
  courseId: number;
  courseCode: string;
  courseName: string;
  courseCategoryId: number;
  courseType: string;
  recurrenceIntervalYears: number | null;
  additionalNote: string;
  userName: string;
  aircraftTypeLicenseId: number | null;
  courseObjective: string;
  requirements: UpsertCourseRequirement[];
}

export const upsertCourse = async (data: UpsertCourseRequest) => {
  try {
    const res = await axiosConfig.post("/training/course/upsert", data);
    return res.data;
  } catch (error: any) {
    console.error("Error upserting course:", error);
    throw new Error(error?.response?.data?.error || error?.response?.data?.message || "Failed to upsert course");
  }
};

export interface CourseCategoryResponseData {
  message: string;
  responseData: CourseCategory[];
  error: string;
}

export const getCourseCategories = async (): Promise<CourseCategoryResponseData> => {
  try {
    const res = await axiosConfig.get("/training/course/categories");
    return res.data as CourseCategoryResponseData;
  } catch (error: any) {
    console.error("Error fetching course categories:", error);
    throw new Error(error?.response?.data?.error || error?.response?.data?.message || "Failed to fetch course categories");
  }
};

export interface CourseDepartmentSub {
  id: number;
  code: string;
  name: string;
  description: string | null;
  courseDepartmentsId: number;
  isdelete: boolean;
  createddate: string;
  createdby: string | null;
  updateddate: string | null;
  updatedby: string | null;
}

export interface CourseDepartmentPosition {
  id: number;
  code: string;
  name: string;
  description: string | null;
  staffDepartmentId: number;
  isdelete: boolean;
  createddate: string;
  createdby: string | null;
  updateddate: string | null;
  updatedby: string | null;
}

export interface CourseDepartment {
  id: number;
  code: string;
  name: string;
  description: string | null;
  isdelete: boolean;
  createddate: string;
  createdby: string | null;
  updateddate: string | null;
  updatedby: string | null;
}

export interface CourseDepartmentItem {
  courseDepartment: CourseDepartment;
  courseDepartmentPositions: CourseDepartmentPosition[];
}

export interface CourseDepartmentResponseData {
  message: string;
  responseData: CourseDepartmentItem[];
  error: string;
}

export const getCourseDepartments = async (): Promise<CourseDepartmentResponseData> => {
  try {
    const res = await axiosConfig.get("/training/courseDepartment/listdata");
    return res.data as CourseDepartmentResponseData;
  } catch (error: any) {
    console.error("Error fetching course departments:", error);
    throw new Error(error?.response?.data?.error || error?.response?.data?.message || "Failed to fetch course departments");
  }
};

export interface CourseMatrixRequest {
  departmentId: number;
  categoryId: number;
  page: number;
  perPage: number;
}

export interface CourseMatrixRequirement {
  departmentSubId: number;
  departmentSubCode: string;
  departmentSubName: string;
  isRequired: boolean;
}

export interface CourseMatrixCourse {
  courseId: number;
  courseName: string;
  requirements: CourseMatrixRequirement[];
}

export interface CourseMatrixDepartmentSub {
  departmentSubId: number;
  departmentSubCode: string;
  departmentSubName: string;
}

export interface CourseMatrixData {
  departmentSubs: CourseMatrixDepartmentSub[];
  courses: CourseMatrixCourse[];
  totalCourses: number;
  page: number;
  perPage: number;
}

export interface CourseMatrixResponseData {
  message: string;
  responseData: CourseMatrixData;
  error: string;
}

export const getCourseMatrix = async (data: CourseMatrixRequest): Promise<CourseMatrixResponseData> => {
  try {
    const res = await axiosConfig.post("/training/course-matrix", data);
    return res.data as CourseMatrixResponseData;
  } catch (error: any) {
    console.error("Error fetching course matrix:", error);
    throw new Error(error?.response?.data?.error || error?.response?.data?.message || "Failed to fetch course matrix");
  }
};

export interface UpsertCourseMatrixRequirementRequest {
  courseId: number;
  courseDepartmentSubId: number;
  isRequired: boolean;
  userName: string;
}

export const upsertCourseMatrixRequirements = async (data: UpsertCourseMatrixRequirementRequest[]) => {
  try {
    const res = await axiosConfig.post("/training/course-department-subs/requirements/upsert", data);
    return res.data;
  } catch (error: any) {
    console.error("Error upserting course matrix requirements:", error);
    throw new Error(error?.response?.data?.error || error?.response?.data?.message || "Failed to upsert requirements");
  }
};

export interface CourseSummaryData {
  totalCourses: number;
  recurrentCount: number;
  initialOnlyCount: number;
  categoriesCount: number;
}

export interface CourseSummaryResponseData {
  message: string;
  responseData: CourseSummaryData;
  error: string;
}

export const getCourseSummary = async (): Promise<CourseSummaryResponseData> => {
  try {
    const res = await axiosConfig.get("/training/course/summary");
    return res.data as CourseSummaryResponseData;
  } catch (error: any) {
    console.error("Error fetching course summary:", error);
    throw new Error(error?.response?.data?.error || error?.response?.data?.message || "Failed to fetch course summary");
  }
};

export interface CourseDepartmentSubListItem {
  id: number;
  code: string;
  name: string;
  description: string | null;
  courseDepartmentsId: number;
  isdelete: boolean;
  createddate: string;
  createdby: string | null;
  updateddate: string | null;
  updatedby: string | null;
}

export interface CourseDepartmentSubListResponseData {
  message: string;
  responseData: CourseDepartmentSubListItem[];
  error: string;
}

export const getCourseDepartmentSubList = async (): Promise<CourseDepartmentSubListResponseData> => {
  try {
    const res = await axiosConfig.get("/training/course-department-position-list");
    return res.data as CourseDepartmentSubListResponseData;
  } catch (error: any) {
    console.error("Error fetching course department sub list:", error);
    throw new Error(error?.response?.data?.error || error?.response?.data?.message || "Failed to fetch department sub list");
  }
};

export interface CourseDetailRequirement {
  id: number;
  courseId: number;
  courseDepartmentSubId: number;
  isRequired: boolean;
  isdelete: boolean;
  createddate: string;
  createdby: string | null;
  updateddate: string | null;
  updatedby: string | null;
}

export interface CourseDetailResponseData {
  message: string;
  responseData: {
    course: {
      id: number;
      courseCode: string;
      courseName: string;
      courseCategoryId: number;
      courseType: string;
      recurrenceIntervalYears: number | null;
      additionalNote: string;
      isdelete: boolean;
      createddate: string;
      createdby: string | null;
      updateddate: string | null;
      updatedby: string | null;
      aircraftTypeLicenseId: number | null;
      courseObjective: string | null;
    };
    requirements: CourseDetailRequirement[];
  };
  error: string;
}

export const getCourseById = async (id: number): Promise<CourseDetailResponseData> => {
  try {
    const res = await axiosConfig.get(`/training/course/byid/${id}`);
    return res.data as CourseDetailResponseData;
  } catch (error: any) {
    console.error(`Error fetching course by id ${id}:`, error);
    throw new Error(error?.response?.data?.error || error?.response?.data?.message || "Failed to fetch course details");
  }
};

// ── Delete Course ──

export interface DeleteCourseRequest {
  id: number;
  userName: string;
}

export interface DeleteCourseResponse {
  message: string;
  responseData: null;
  error: string;
}

export const deleteCourse = async (data: DeleteCourseRequest): Promise<DeleteCourseResponse> => {
  try {
    const res = await axiosConfig.post("/training/course/delete", data);
    return res.data as DeleteCourseResponse;
  } catch (error: any) {
    console.error("Error deleting course:", error);
    throw new Error(error?.response?.data?.error || error?.response?.data?.message || "Failed to delete course");
  }
};
