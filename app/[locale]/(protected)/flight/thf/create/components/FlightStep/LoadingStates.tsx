interface LoadingStatesProps {
  flightInfosId: number | null;
  loadingFlight: boolean;
  flightError: any;
}

export const LoadingStates = ({ flightInfosId, loadingFlight, flightError }: LoadingStatesProps) => {
  if (!flightInfosId) return null;

  if (loadingFlight) {
    return (
      <div className="p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-700">
          🔄 Loading flight data (ID: {flightInfosId})...
        </p>
      </div>
    );
  }

  if (flightError) {
    return (
      <div className="p-4 bg-red-50 rounded-lg">
        <p className="text-sm text-red-700">
          ❌ Failed to load flight data: {flightError.message}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-green-50 rounded-lg">
      <p className="text-sm text-green-700">
        ✅ Flight data loaded successfully (ID: {flightInfosId})
      </p>
    </div>
  );
};
