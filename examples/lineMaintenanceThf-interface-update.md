# LineMaintenanceThfResponse Interface Update

## Summary of Changes

Updated the interfaces to match the actual API response structure based on the provided JSON data.

### Key Changes Made:

1. **AdditionalDefectAttachFile Interface Added:**
   ```typescript
   export interface AdditionalDefectAttachFile {
     additionalDefectId: string;
     storagePath: string;
     realName: string;
     fileType: string;
   }
   ```

2. **AdditionalDefect Interface Updated:**
   ```typescript
   // Before
   attachFiles: string | null;
   
   // After  
   attachFiles: AdditionalDefectAttachFile | null;
   ```

3. **AttachFile Interface Updated:**
   ```typescript
   // Before
   export interface AttachFile {
     storagePath: string;
     name: string;
     realName: string;
     fileType: string;
     documentType: string;
   }
   
   // After
   export interface AttachFile {
     additionalDefectId: string;
     storagePath: string;
     realName: string;
     fileType: string;
   }
   ```

4. **Flight Interface Updated:**
   ```typescript
   // Changes made:
   - acType: CodeObject → acType?: CodeObject (made optional)
   - routeFrom → routeForm (fixed typo)
   - Added: acTypeId?: number | null
   ```

### API Response Structure Now Matches:

✅ **AdditionalDefect.attachFiles** - Now properly typed as object instead of string
✅ **AttachFile** - Fields match actual response (additionalDefectId, no name/documentType)  
✅ **Flight** - acType is optional, routeForm typo fixed, acTypeId added
✅ **All null values** - Properly handled throughout interfaces

### Files Updated:
- `/lib/api/lineMaintenances/flight/getlineMaintenancesThfByFlightId.ts`

### Validation:
- ✅ No TypeScript errors
- ✅ Interface structure matches actual API response
- ✅ All nested objects properly typed
- ✅ Nullable fields correctly handled

The interfaces now accurately reflect the actual API response structure for the lineMaintenances THF endpoint.
