import { toast } from '@/components/ui/use-toast'
import { usePushThf } from '@/lib/api/hooks/usePushThf'
import type { Step1FormInputs } from './types'
import { sendTime } from './utils'
import { combineFormToUtcDatetime } from '@/lib/utils/flightDatetime';

export const useFlightSubmission = (flightData: any, onSave: (data: any) => void, goNext: () => void) => {
  const { mutate, isPending, error: mError } = usePushThf();

  const onSubmit = (data: Step1FormInputs) => {
    const pushThfData = {
      flightsId: flightData?.flightsId || 0,
      flightInfosId: flightData?.flightInfosId || 0,
      airlinesCode: data.customer?.value || "",
      stationsCode: data.station?.value || "",
      acReg: data.acReg || "",
      acTypeCode: data.acTypeCode?.value || "",
      arrivalFlightNo: data.flightArrival || "",
      arrivalStaDate: combineFormToUtcDatetime(data.arrivalDate, data.sta),
      arrivalAtaDate: combineFormToUtcDatetime(data.arrivalDate, data.ata),
      departureFlightNo: data.flightDeparture || "",
      departureStdDate: combineFormToUtcDatetime(data.departureDate, data.std),
      departureAtdDate: combineFormToUtcDatetime(data.departureDate, data.atd),
      bayNo: data.bay || "",
      statusCode: data.status?.value || "Normal",
      note: data.note || "",
      thfNo: data.thfNumber || "",
      routeFrom: data.routeFrom?.value || "",
      routeTo: data.routeTo?.value || "",
    };

    // Call push THF API
    mutate(pushThfData, {
      onSuccess: (response) => {
        // toast({
        //   title: "Success",
        //   description: `THF ${data.thfNumber} has been saved successfully.`,
        // });

        // console.log("Push THF success:", response);

        // Save form data to step context
        onSave(data);

        // Go to next step
        goNext();
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Failed to save THF",
          description: error?.message || "An error occurred while saving THF data.",
        });
      },
    });
  };

  return { onSubmit, isPending, mError };
};
