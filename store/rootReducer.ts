
import auth from "@/components/partials/auth/store";
import permission from "@/components/partials/auth/permissionSlice";

const rootReducer = {
  auth,
  permission,
};

export type RootState = {
  auth: ReturnType<typeof auth>;
  permission: ReturnType<typeof permission>;
};

export default rootReducer;
