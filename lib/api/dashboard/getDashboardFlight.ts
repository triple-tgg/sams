import axios from "@/lib/axios.config";

export interface DashboardFlightRes {
  planned: number;
  actual: number;
  additional: number;
  cancel: number;
}

export async function getDashboardFlight(): Promise<DashboardFlightRes> {
  const apiUrl = process.env.NEXT_PUBLIC_ENVIRONTMENT !== "production"
    ? `${process.env.NEXT_PUBLIC_DEVELOPMENT_API}/dashboard/flight`
    : `${process.env.NEXT_PUBLIC_PRODUCTION_API}/dashboard/flight`;
  console.log('[DASHBOARD FLIGHT] apiUrl:', apiUrl);
  try {
    const res = await axios.get(apiUrl, {
      headers: { 'Content-Type': 'application/json' },
    });
    // API response: { message, responseData: { planned, actual, additional, cancel }, error }
    return res.data.responseData as DashboardFlightRes;
  } catch (error) {
    console.error('[DASHBOARD FLIGHT] error:', error);
    throw error;
  }
}
