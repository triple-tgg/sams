import { SelectField, InputField, StringSelectField } from './FormFields'
import type { Option } from './types'

interface CustomerStationSectionProps {
  control: any;
  errors: any;
  customerOptions: Option[];
  stationOptions: Option[];
  loadingAirlines: boolean;
  loadingStations: boolean;
  airlinesError: any;
  acTypeCodeError: any;
  stationsError: any;
  airlinesUsingFallback: boolean;
  stationsUsingFallback: boolean;
  aircraftOptions: Option[];
  isLoadingAircraft: boolean;
  acTypeCodeUsingFallback: boolean;
}

export const CustomerStationSection = ({
  control,
  errors,
  customerOptions,
  stationOptions,
  loadingAirlines,
  loadingStations,
  airlinesError,
  stationsError,
  airlinesUsingFallback,
  stationsUsingFallback,
  aircraftOptions,
  isLoadingAircraft,
  acTypeCodeUsingFallback,
  acTypeCodeError
}: CustomerStationSectionProps) => (
  <div className="grid lg:grid-cols-2 gap-6">
    <SelectField
      name="customer"
      control={control}
      label="Customer / Airlines"
      placeholder="Select customer"
      options={customerOptions}
      isLoading={loadingAirlines}
      error={airlinesError}
      usingFallback={airlinesUsingFallback}
      errorMessage={errors.customer?.message}
    />

    <SelectField
      name="station"
      control={control}
      label="Station"
      placeholder="Select station"
      options={stationOptions}
      isLoading={loadingStations}
      error={stationsError}
      usingFallback={stationsUsingFallback}
      errorMessage={errors.station?.message}
    />

    <InputField
      name="acReg"
      control={control}
      label="A/C Reg"
      placeholder="A/C Reg"
      errorMessage={errors.acReg?.message}
    />

    <SelectField
      name="acTypeCode"
      control={control}
      label="A/C Type"
      placeholder="Select A/C Type"
      options={aircraftOptions}
      isLoading={isLoadingAircraft}
      usingFallback={acTypeCodeUsingFallback}
      errorMessage={errors.acTypeCode?.message}
      error={acTypeCodeError}
    />
  </div>
);

interface FlightSectionProps {
  control: any;
  errors: any;
  stationOptions: Option[];
  loadingStations: boolean;
  stationsError: any;
  stationsUsingFallback: boolean;
  title?: string;
  flightField: string;
  dateField: string;
  stdField: string;
  atdField: string;
  routeField: string;
  stdLabel: string;
  atdLabel: string;
  routeLabel: string;
}

export const FlightSection = ({
  control,
  errors,
  stationOptions,
  loadingStations,
  stationsError,
  stationsUsingFallback,
  title,
  flightField,
  dateField,
  stdField,
  atdField,
  routeField,
  stdLabel,
  atdLabel,
  routeLabel
}: FlightSectionProps) => (
  <div>
    <h4 className="text-sm font-medium mb-2">{title}</h4>
    <div className="grid grid-cols-2 gap-4">
      <InputField
        name={flightField}
        control={control}
        label="Flight No"
        placeholder="Flight No"
        errorMessage={errors[flightField]?.message}
      />

      <InputField
        name={dateField}
        control={control}
        label="Date"
        type="date"
        errorMessage={errors[dateField]?.message}
      />

      <InputField
        name={stdField}
        control={control}
        label={stdLabel}
        type="time"
        errorMessage={errors[stdField]?.message}
      />

      <InputField
        name={atdField}
        control={control}
        label={atdLabel}
        type="time"
        errorMessage={errors[atdField]?.message}
      />

      <div className="col-span-2">
        <StringSelectField
          name={routeField}
          control={control}
          label={routeLabel}
          placeholder="Select station"
          options={stationOptions}
          isLoading={loadingStations}
          error={stationsError}
          usingFallback={stationsUsingFallback}
          errorMessage={errors[routeField]?.message}
        />
      </div>
    </div>
  </div>
);
