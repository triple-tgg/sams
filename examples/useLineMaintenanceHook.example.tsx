// Example usage of the updated hook

import { useLineMaintenancesQueryThfByFlightId, useFlightInfoToFormData } from "@/lib/api/hooks/uselineMaintenancesQueryThfByFlightId";

// Method 1: Using the main hook
export const ExampleComponent1 = ({ flightId }: { flightId: number }) => {
  const {
    isLoading,
    error,
    formData,          // 🎯 Ready-to-use form data
    flightData,        // Flight information
    lineMaintenanceData, // THF data
    aircraftData,      // Aircraft details
    equipmentData,     // Equipment list
    partsToolData,     // Parts/Tools list
    attachFilesData    // Attached files
  } = useLineMaintenancesQueryThfByFlightId({ flightId });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Flight: {formData?.flightArrival}</h2>
      <p>THF: {formData?.thfNumber}</p>
      <p>Customer: {formData?.customer?.label}</p>
      <p>Station: {formData?.station?.label}</p>
      {/* Form data is ready to populate your forms */}
    </div>
  );
};

// Method 2: Using the alias (same functionality)
export const ExampleComponent2 = ({ flightId }: { flightId: number }) => {
  const {
    formData,
    flightData,
    isLoading,
    error
  } = useFlightInfoToFormData({ flightId });

  // Same usage as above...
  return (
    <div>
      {/* Your component content */}
    </div>
  );
};

// Method 3: Form integration example
export const FlightFormExample = ({ flightId }: { flightId: number }) => {
  const { formData, isLoading } = useLineMaintenancesQueryThfByFlightId({ flightId });
  
  // Use formData to populate your React Hook Form
  // useEffect(() => {
  //   if (formData) {
  //     form.reset(formData); // Populate form with API data
  //   }
  // }, [formData, form]);

  return (
    <form>
      {/* Your form fields here */}
      {/* formData contains all the mapped values ready to use */}
    </form>
  );
};
