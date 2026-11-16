import { beforeEach, describe, expect, it, vi } from "vitest";

const axiosMock = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock("@/lib/axios.config", () => ({ default: axiosMock }));

import { getAllLogbookRecords } from "./logbook-records";

const row = (id: number) => ({ id, nameSurname: "A", employeeId: "0020" });
const page = (ids: number[], total: number) => ({
  data: { message: "success", responseData: ids.map(row), page: 1, perPage: 2, total, totalAll: total, error: "" },
});

describe("getAllLogbookRecords", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetches every page until the total is reached", async () => {
    axiosMock.post
      .mockResolvedValueOnce(page([1, 2], 5))
      .mockResolvedValueOnce(page([3, 4], 5))
      .mockResolvedValueOnce(page([5], 5));
    const all = await getAllLogbookRecords({ staffId: 161 }, { perPage: 2 });
    expect(all.map((r) => r.id)).toEqual([1, 2, 3, 4, 5]);
    expect(axiosMock.post).toHaveBeenCalledTimes(3);
    expect(axiosMock.post.mock.calls[1][1]).toMatchObject({ staffId: 161, page: 2, perPage: 2, startDate: null });
  });

  it("stops on a short page", async () => {
    axiosMock.post.mockResolvedValueOnce(page([1], 0));
    expect(await getAllLogbookRecords({ staffId: 1 }, { perPage: 2 })).toHaveLength(1);
    expect(axiosMock.post).toHaveBeenCalledTimes(1);
  });
});
