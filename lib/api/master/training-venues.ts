import axiosConfig from "@/lib/axios.config";

// ──────────────────────────────────────────────────────────────
// Interfaces
// ──────────────────────────────────────────────────────────────

export interface TrainingVenueItem {
  id: number;
  code: string;
  name: string;
  description: string | null;
  isdelete?: boolean;
  createddate?: string | null;
  createdby?: string | null;
  updateddate?: string | null;
  updatedby?: string | null;
}

export interface TrainingVenueListResponse {
  message: string;
  responseData: TrainingVenueItem[] | null;
  error: string;
}

export interface TrainingVenueResponse {
  message: string;
  responseData: TrainingVenueItem | null;
  error: string;
}

export interface TrainingVenueUpsertRequest {
  id: number; // 0 = add, existing id = update
  code: string;
  name: string;
  description: string;
}

export interface TrainingVenueDeleteRequest {
  id: number;
}

const errorMessage = (error: any, fallback: string): string =>
  error?.response?.data?.error || error?.response?.data?.message || error?.message || fallback;

// ──────────────────────────────────────────────────────────────
// API Functions
// ──────────────────────────────────────────────────────────────

/** GET all training venues */
export const getTrainingVenueList = async (): Promise<TrainingVenueListResponse> => {
  try {
    const res = await axiosConfig.get("/master/trainingVenues/listdata");
    return res.data;
  } catch (error) {
    throw new Error(errorMessage(error, "Failed to load training venues"));
  }
};

/** GET one training venue by id */
export const getTrainingVenueById = async (id: number): Promise<TrainingVenueResponse> => {
  try {
    const res = await axiosConfig.get(`/master/trainingVenues/${id}`);
    return res.data;
  } catch (error) {
    throw new Error(errorMessage(error, "Failed to load training venue"));
  }
};

/** POST create (id = 0) or update a training venue */
export const upsertTrainingVenue = async (
  data: TrainingVenueUpsertRequest
): Promise<TrainingVenueResponse> => {
  try {
    const res = await axiosConfig.post("/master/trainingVenues/upsert", data);
    return res.data;
  } catch (error) {
    throw new Error(errorMessage(error, "Failed to save training venue"));
  }
};

/** POST delete a training venue */
export const deleteTrainingVenue = async (
  data: TrainingVenueDeleteRequest
): Promise<TrainingVenueResponse> => {
  try {
    const res = await axiosConfig.post("/master/trainingVenues/delete", data);
    return res.data;
  } catch (error) {
    throw new Error(errorMessage(error, "Failed to delete training venue"));
  }
};
