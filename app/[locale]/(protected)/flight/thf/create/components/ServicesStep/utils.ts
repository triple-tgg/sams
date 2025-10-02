import { LineMaintenanceThfResponse } from '@/lib/api/lineMaintenances/flight/getlineMaintenancesThfByFlightId'
import { ServicesFormInputs } from './types'
import { AircraftCheckType } from '@/lib/api/master/aircraft-check-types/airlines.interface'

type FluidFormData = ServicesFormInputs['fluid']

/**
 * Get default values for the services form
 * @param checkTypes - Optional aircraft check types for setting default maintenance type
 */
export const getDefaultValues = (checkTypes?: AircraftCheckType[]): ServicesFormInputs => {
  // Get the first available maintenance type or empty string
  const defaultMaintenanceType = getDefaultMaintenanceType(checkTypes)

  return {
    aircraftChecks: [{
      maintenanceTypes: defaultMaintenanceType,
      maintenanceSubTypes: [],
      laeMH: "",
      mechMH: "",
    }],
    additionalDefectRectification: false,
    additionalDefects: [],
    servicingPerformed: false,
    fluid: {
      fluidName: null,
      engOilSets: [{ left: 0, right: 0 }],
      hydOilBlue: 0,
      hydOilGreen: 0,
      hydOilYellow: 0,
      hydOilA: 0,
      hydOilB: 0,
      hydOilSTBY: 0,
      otherOil: 0,
    },
    addPersonnels: false,
    personnel: [],
    flightDeck: false,
    // flightDeckInfo: [],
    aircraftTowing: false,
    aircraftTowingInfo: [],
  }
}

/**
 * Get the default maintenance type from available check types
 * @param checkTypes - Array of aircraft check types
 * @returns Default maintenance type code or empty string
 */
export const getDefaultMaintenanceType = (checkTypes?: AircraftCheckType[]): string => {
  if (!checkTypes || checkTypes.length === 0) {
    console.warn('No aircraft check types available for setting default maintenance type')
    return ""
  }

  // Find the first non-deleted check type
  const availableType = checkTypes.find(type => !type.isdelete)

  if (!availableType) {
    console.warn('No active aircraft check types found')
    return ""
  }

  console.log(`Setting default maintenance type to: ${availableType.code} (${availableType.name})`)
  return availableType.code
}

export const transformFluidData = (fluidData: FluidFormData) => {
  const engOilSets = fluidData.engOilSets || [{ left: "", right: "" }]

  return {
    fluidName: fluidData.fluidName?.value || "",
    engOil1L: engOilSets[0]?.left || 0,
    engOil1R: engOilSets[0]?.right || 0,
    engOil2L: engOilSets[1]?.left || 0,
    engOil2R: engOilSets[1]?.right || 0,
    engOil3L: engOilSets[2]?.left || 0,
    engOil3R: engOilSets[2]?.right || 0,
    engOil4L: engOilSets[3]?.left || 0,
    engOil4R: engOilSets[3]?.right || 0,

    hydOilBlue: fluidData.hydOilBlue || 0,
    hydOilGreen: fluidData.hydOilGreen || 0,
    hydOilYellow: fluidData.hydOilYellow || 0,

    hydOilA: fluidData.hydOilA || fluidData.hydOilBlue || 0,
    hydOilB: fluidData.hydOilB || fluidData.hydOilGreen || 0,
    hydOilSTBY: fluidData.hydOilSTBY || fluidData.hydOilYellow || 0,
    otherOil: fluidData.otherOil || 0,
  }
}
export const transformFluidDataToAPI = (fluidData: FluidFormData) => {
  const engOilSets = fluidData.engOilSets || [{ left: "", right: "" }]

  return {
    fluidName: fluidData.fluidName?.value || "",
    engOil: engOilSets.map(set => ({ left: set.left || 0, right: set.right || 0 })),

    hydOilBlue: fluidData.hydOilBlue || 0,
    hydOilGreen: fluidData.hydOilGreen || 0,
    hydOilYellow: fluidData.hydOilYellow || 0,

    hydOilA: fluidData.hydOilA || fluidData.hydOilBlue || 0,
    hydOilB: fluidData.hydOilB || fluidData.hydOilGreen || 0,
    hydOilSTBY: fluidData.hydOilSTBY || fluidData.hydOilYellow || 0,
    otherOil: fluidData.otherOil || 0,
  }
}
export const transformServicesDataToAPI = (data: ServicesFormInputs) => {
  console.log("transformServicesDataToAPI called with data:", data);

  const aircraftChecks = data.aircraftChecks.map(check => ({
    maintenanceTypes: check.maintenanceTypes,
    maintenanceSubTypes: check.maintenanceSubTypes.join(','),
    laeMH: Number(check.laeMH) || 0,
    mechMH: Number(check.mechMH) || 0,
  }))

  const personnel = data.addPersonnels ?
    (data.personnel || []).map(p => ({
      staffId: p.staffId,
      staffCode: p.staffCode,
      name: p.name,
      type: p.type,
      formDate: p.formDate,
      toDate: p.toDate,
      formTime: p.formTime,
      toTime: p.toTime,
      remark: p.remark || "",
    })) : []

  const aircraftTowingInfo = data.aircraftTowing ?
    (data.aircraftTowingInfo || []).map(info => ({
      onDate: info.onDate,
      offDate: info.offDate,
      onTime: info.onTime,
      offTime: info.offTime,
      bayForm: info.bayForm, // Transform bayForm to bayForm for API
      bayTo: info.bayTo,
    })) : []

  return {
    aircraftChecks,
    additionalDefectRectification: data.additionalDefectRectification,
    additionalDefects: data.additionalDefectRectification ? (data.additionalDefects || []) : [],
    servicingPerformed: data.servicingPerformed,
    fluid: data.servicingPerformed ? data.fluid : null,
    addPersonnels: data.addPersonnels,
    personnel,
    flightDeck: data.flightDeck,
    // flightDeckInfo,
    aircraftTowing: data.aircraftTowing,
    aircraftTowingInfo,
  }
}

export const formatTimeForDisplay = (time: string): string => {
  if (!time) return ""
  // Ensure the time is in HH:MM format
  const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  if (timePattern.test(time)) {
    return time
  }
  // If it's just numbers, format it
  if (/^\d{1,4}$/.test(time)) {
    const paddedTime = time.padStart(4, '0')
    return `${paddedTime.slice(0, 2)}:${paddedTime.slice(2)}`
  }
  return time
}

export const validateTimeRange = (from: string, to: string): boolean => {
  if (!from || !to) return true // Allow empty values

  const [fromHour, fromMin] = from.split(':').map(Number)
  const [toHour, toMin] = to.split(':').map(Number)

  const fromMinutes = fromHour * 60 + fromMin
  const toMinutes = toHour * 60 + toMin

  return fromMinutes < toMinutes
}
export const mapDataThfToServicesStep = (queryData: LineMaintenanceThfResponse | null): ServicesFormInputs | null => {
  if (!queryData?.responseData) return null;

  const { aircraft, lineMaintenance } = queryData.responseData;

  // Map aircraft checks
  const aircraftChecks = aircraft?.aircraftCheckType?.length > 0
    ? aircraft.aircraftCheckType.map(check => ({
      maintenanceTypes: check.checkType || "",
      maintenanceSubTypes: Array.isArray(check.checkSubType) ? check.checkSubType : [],
      laeMH: "",
      mechMH: "",
    }))
    : [{
      maintenanceTypes: "",
      maintenanceSubTypes: [],
      laeMH: "",
      mechMH: "",
    }];

  // Map additional defects
  const additionalDefects = aircraft?.additionalDefect?.map(defect => ({
    defect: defect.details || "",
    ataChapter: defect.ataChapter || "",
    laeMH: defect.lae?.toString() || "",
    mechMH: defect.mech?.toString() || "",
    attachFiles: defect.attachFiles ? defect.attachFiles : null,
    // Note: photo files would need special handling for FileList
  })) || [];

  // Map fluid data
  const fluidServicing = aircraft?.fluidServicing;
  const engOilSets = fluidServicing?.engOil?.map(oil => ({
    left: oil.left || 0,
    right: oil.left || 0,
  })) || [{ left: 0, right: 0 }];

  const fluid = {
    fluidName: fluidServicing?.fluidName ? {
      value: fluidServicing.fluidName,
      label: fluidServicing.fluidName
    } : null,
    engOilSets,
    hydOilBlue: fluidServicing?.hydraulicA || 0,
    hydOilGreen: fluidServicing?.hydraulicB || 0,
    hydOilYellow: fluidServicing?.hydraulicSTBY || 0,

    hydOilA: fluidServicing?.hydraulicA || 0,
    hydOilB: fluidServicing?.hydraulicB || 0,
    hydOilSTBY: fluidServicing?.hydraulicSTBY || 0,

    otherOil: fluidServicing?.otherOil || 0,
  };

  // Map personnel
  const personnel = aircraft?.personnels?.map(person => ({
    staffId: person.staff?.id || 0,
    staffCode: person.staff?.code || "",
    name: person.staff?.name || "",
    type: person.staff?.staffsType || "",
    formDate: person.formDate || "",
    toDate: person.toDate || "",
    formTime: person.formTime || "",
    toTime: person.toTime || "",
    remark: person.note || "",
  })) || [];


  const aircraftTowingInfo = aircraft?.aircraftTowing?.map(towing => ({
    onDate: towing.onDate || "",
    offDate: towing.offDate || "",
    onTime: towing.onTime || "",
    offTime: towing.offTime || "",
    bayForm: towing.bayForm || "", // API field is bayForm, mapping to bayForm
    bayTo: towing.bayTo || "", // Add bay to field
  })) || [];

  return {
    aircraftChecks,
    additionalDefectRectification: lineMaintenance?.isAdditionalDefect || false,
    additionalDefects: lineMaintenance?.isAdditionalDefect ? additionalDefects : [],
    servicingPerformed: lineMaintenance?.isFluidServicing || false,
    fluid,
    addPersonnels: lineMaintenance?.isPersonnels || false,
    personnel: lineMaintenance?.isPersonnels ? personnel : [],
    flightDeck: lineMaintenance?.isFlightdeck || false,
    // flightDeckInfo: lineMaintenance?.isFlightdeck ? flightDeckInfo : [],
    aircraftTowing: lineMaintenance?.isAircraftTowing || false,
    aircraftTowingInfo: lineMaintenance?.isAircraftTowing ? aircraftTowingInfo : [],
  };
};