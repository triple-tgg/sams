import { beforeEach, describe, expect, it, vi } from "vitest";

const axiosMock = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock("@/lib/axios.config", () => ({ default: axiosMock }));

import { deleteFlightInfos } from "./deleteFlightInfos";

describe("deleteFlightInfos", () => {
  beforeEach(() => vi.clearAllMocks());

  it("posts the flightInfosId list, dropping empty / non-positive IDs", async () => {
    axiosMock.post.mockResolvedValue({ data: { message: "success", responseData: null, error: "" } });
    await deleteFlightInfos([12, 0, -1, 34]);
    expect(axiosMock.post).toHaveBeenCalledWith("/flight/delete-flightinfos", { flightInfoList: [12, 34] });
  });

  it("does not call the API when there is no valid ID", async () => {
    await expect(deleteFlightInfos([0])).rejects.toThrow("at least one positive FlightInfo ID");
    expect(axiosMock.post).not.toHaveBeenCalled();
  });

  it("surfaces the backend error from a 200 { message: 'error' } envelope", async () => {
    axiosMock.post.mockResolvedValue({
      data: { message: "error", responseData: null, error: "flightInfoList must contain at least one positive FlightInfo ID." },
    });
    await expect(deleteFlightInfos([5])).rejects.toThrow("flightInfoList must contain at least one positive FlightInfo ID.");
  });
});
