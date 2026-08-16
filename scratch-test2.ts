import { groupAircraftEngineDisplayLabels } from './lib/utils/aircraftEngineDisplay';

const payload = [
    {
        id: 209,
        staffId: 163,
        isdelete: false,
        createddate: "2026-08-14T07:40:47.010779",
        createdby: "admin",
        updateddate: "",
        updatedby: "",
        aircraftEngineId: 23,
        aircraftEngineObj: {
            id: 23,
            familyCode: "A318",
            series: null,
            engineCode: "CFM56",
            validFrom: null,
            validTo: null,
            updatedBy: null,
            updatedAtUtc: null
        }
    }
];

// @ts-ignore
console.log(groupAircraftEngineDisplayLabels(payload));
