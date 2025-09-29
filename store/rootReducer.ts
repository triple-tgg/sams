
import auth from "@/components/partials/auth/store";

const rootReducer = {
  auth,
};
export type RootState = {
  auth: ReturnType<typeof auth>;
};

export default rootReducer;
