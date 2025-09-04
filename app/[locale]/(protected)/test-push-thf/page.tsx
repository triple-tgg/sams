"use client";

import { useState } from "react";
import { usePushThf } from "@/lib/api/hooks/usePushThf";
import { PushThfRequest } from "@/lib/api/lineMaintenances/flight-thf/pushThf";

export default function TestPushThfPage() {
  const { mutate: pushThf, isPending, error, data } = usePushThf();

  const [formData, setFormData] = useState<PushThfRequest>({
    flightsId: 0,
    flightInfosId: 1,
    airlinesCode: "SEJ",
    stationsCode: "BKK",
    acReg: "",
    acTypeCode: "",
    arrivalFlightNo: "STFFG-1234",
    arrivalDate: "2025-08-19",
    arrivalStaTime: "13:00",
    arrivalAtaTime: "13:30",
    departureFlightNo: "",
    departureDate: "",
    departureStdTime: "",
    departureAtdTime: "",
    bayNo: "",
    statusCode: "Normal",
    note: "",
    thfNo: "THF-navee546"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    pushThf(formData);
  };

  const handleInputChange = (field: keyof PushThfRequest, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test Push THF API</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Flights ID</label>
            <input
              type="number"
              value={formData.flightsId}
              onChange={(e) => handleInputChange('flightsId', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Flight Infos ID</label>
            <input
              type="number"
              value={formData.flightInfosId}
              onChange={(e) => handleInputChange('flightInfosId', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Airlines Code</label>
            <input
              type="text"
              value={formData.airlinesCode}
              onChange={(e) => handleInputChange('airlinesCode', e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Stations Code</label>
            <input
              type="text"
              value={formData.stationsCode}
              onChange={(e) => handleInputChange('stationsCode', e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">AC Reg</label>
            <input
              type="text"
              value={formData.acReg}
              onChange={(e) => handleInputChange('acReg', e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">AC Type</label>
            <input
              type="text"
              value={formData.acTypeCode}
              onChange={(e) => handleInputChange('acTypeCode', e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Arrival Flight No</label>
            <input
              type="text"
              value={formData.arrivalFlightNo}
              onChange={(e) => handleInputChange('arrivalFlightNo', e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Arrival Date</label>
            <input
              type="date"
              value={formData.arrivalDate}
              onChange={(e) => handleInputChange('arrivalDate', e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Arrival STA Time</label>
            <input
              type="time"
              value={formData.arrivalStaTime}
              onChange={(e) => handleInputChange('arrivalStaTime', e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Arrival ATA Time</label>
            <input
              type="time"
              value={formData.arrivalAtaTime}
              onChange={(e) => handleInputChange('arrivalAtaTime', e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">THF No</label>
            <input
              type="text"
              value={formData.thfNo}
              onChange={(e) => handleInputChange('thfNo', e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status Code</label>
            <input
              type="text"
              value={formData.statusCode}
              onChange={(e) => handleInputChange('statusCode', e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Note</label>
          <textarea
            value={formData.note}
            onChange={(e) => handleInputChange('note', e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            rows={3}
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {isPending ? "Pushing THF..." : "Push THF"}
        </button>
      </form>

      {/* Response Display */}
      {data && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 className="text-lg font-semibold text-green-800 mb-2">Success Response</h3>
          <pre className="text-sm text-green-700 whitespace-pre-wrap">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
          <p className="text-red-700">{error.message}</p>
        </div>
      )}

      {/* Current Form Data Preview */}
      <div className="mt-6 p-4 bg-gray-50 border rounded-md">
        <h3 className="text-lg font-semibold mb-2">Current Form Data</h3>
        <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-auto">
          {JSON.stringify(formData, null, 2)}
        </pre>
      </div>
    </div>
  );
}
