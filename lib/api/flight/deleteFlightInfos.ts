import axiosConfig from "@/lib/axios.config";

export interface DeleteFlightInfosResponse {
  message: string;
  responseData: unknown;
  error: string;
}

/**
 * POST /flight/delete-flightinfos
 * Body: { flightInfoList: number[] } — flightInfosId of each flight to delete.
 * The backend rejects an empty list / non-positive IDs, so they are filtered out up front.
 */
export const deleteFlightInfos = async (flightInfoIds: number[]): Promise<DeleteFlightInfosResponse> => {
  const flightInfoList = flightInfoIds.filter((id) => Number.isInteger(id) && id > 0);
  if (flightInfoList.length === 0) {
    throw new Error("flightInfoList must contain at least one positive FlightInfo ID.");
  }

  const response = await axiosConfig.post<DeleteFlightInfosResponse>("/flight/delete-flightinfos", { flightInfoList });
  // The API can answer 200 with { message: "error", error: "..." } — treat that as a failure.
  if (response.data?.error || response.data?.message === "error") {
    throw new Error(response.data?.error || "Failed to delete flights");
  }
  return response.data;
};
