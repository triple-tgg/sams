import { Loader2, XCircle, CheckCircle2 } from 'lucide-react';

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
          <Loader2 className="h-4 w-4 inline-block mr-1 -mt-0.5 animate-spin" /> Loading flight data (ID: {flightInfosId})...
        </p>
      </div>
    );
  }

  if (flightError) {
    return (
      <div className="p-4 bg-red-50 rounded-lg">
        <p className="text-sm text-red-700">
          <XCircle className="h-4 w-4 inline-block mr-1 -mt-0.5" /> Failed to load flight data: {flightError.message}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-green-50 rounded-lg">
      <p className="text-sm text-green-700">
        <CheckCircle2 className="h-4 w-4 inline-block mr-1 -mt-0.5" /> Flight data loaded successfully (ID: {flightInfosId})
      </p>
    </div>
  );
};
