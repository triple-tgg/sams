// src/lib/api/hooks/useAddFlight.ts
"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addFlight, type FlightData, type AddFlightRes } from "@/lib/api/flight/addFlight";

export function useAddFlight() {
  const qc = useQueryClient();
  return useMutation<AddFlightRes, Error, { payload: FlightData; token?: string }>({
    mutationFn: ({ payload, token }) => addFlight(payload, { token }),
    onSuccess: () => {
      // ให้ตรงกับ key ที่คุณใช้ดึงรายการเที่ยวบิน
      qc.invalidateQueries({ queryKey: ["flightList"] });
    },
  });
}
