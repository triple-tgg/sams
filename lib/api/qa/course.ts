import axiosConfig from "@/lib/axios.config";

export interface CourseListRequest {
  categoryId: number | null;
  courseName: string;
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
    throw new Error(error.response?.data?.message || "Failed to fetch course list");
  }
};

export interface UpsertCourseRequest {
  courseId: number;
  courseCode: string;
  courseName: string;
  courseCategoryId: number;
  courseType: string;
  recurrenceIntervalYears: number | null;
  additionalNote: string;
  userName: string;
}

export const upsertCourse = async (data: UpsertCourseRequest) => {
  try {
    const res = await axiosConfig.post("/training/course/upsert", data);
    return res.data;
  } catch (error: any) {
    console.error("Error upserting course:", error);
    throw new Error(error.response?.data?.message || "Failed to upsert course");
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
    throw new Error(error.response?.data?.message || "Failed to fetch course categories");
  }
};
