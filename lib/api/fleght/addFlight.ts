import axios from "axios";

const API_URL =
  "https://sam-api-staging-triple-tcoth-production.up.railway.app/flight/import";

export interface FlightData {
  id: number;
  airlinesCode: string;
  stationsCode: string;
  acReg: string;
  acType: string;
  arrivalFlightNo: string;
  arrivalDate: string;
  arrivalStaTime: string;
  arrivalAtaTime: string;
  departureFlightNo: string;
  departureDate: string;
  departureStdTime: string;
  departureAtdTime: string;
  bayNo: string;
  thfNo: string;
  statusCode: string;
  note: string;
}

export const addFlight = async (flightData: FlightData) => {
  try {
    const response = await axios.post(API_URL, flightData, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error: any) {
    console.error("Error adding flight:", error.response?.data || error.message);
    throw error;
  }
};
