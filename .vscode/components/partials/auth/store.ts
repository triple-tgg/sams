"use client";
import { toast } from "@/components/ui/use-toast";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface AuthProfile {
  id?: number | null;
  fullName?: string | null;
  email?: string | null;
  username?: string | null;
  role?: string;
  token?: string;
  reToken?: string;
}

export interface AuthState {
  users: AuthProfile | undefined;
  isAuth: boolean;
}

const initialUsers: () => AuthProfile | undefined = () => {
  if (typeof window !== "undefined") {
    const item = window?.localStorage.getItem("users");
    // if item is json string then parse it and return
    if (item && typeof item === "string" && item.startsWith("{")) {
      return JSON.parse(item);
    }
  }
  return undefined;
};
// save users in local storage

const initialIsAuth: () => boolean = () => {
  if (typeof window !== "undefined") {
    const item = window?.localStorage.getItem("isAuth");
    if (item && typeof item === "string") {
      return item ? JSON.parse(item) : false;
    }
  }
  return false;
};

export const authSlice = createSlice({
  name: "auth",
  initialState: {
    users: initialUsers(),
    isAuth: initialIsAuth(),
  },
  reducers: {
    handleLogin: (state: AuthState, action: PayloadAction<AuthState>) => {
      state.isAuth = action.payload.isAuth;
      state.users = action.payload.users;
      // save isAuth in local storage
      if (typeof window !== "undefined" && state.isAuth) {
        window?.localStorage.setItem("isAuth", JSON.stringify(state.isAuth));
        window?.localStorage.setItem("users", JSON.stringify(state.users));
        toast({
          variant: "success",
          title: "Login Successful",
          description: "Welcome back!"
        });

      } else {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "User not logged in"
        });
      }

    },
    handleLogout: (state: AuthState) => {
      state.isAuth = false;
      state.users = undefined;
      // remove isAuth from local storage
      if (typeof window !== "undefined") {
        window?.localStorage.removeItem("isAuth");
        window?.localStorage.removeItem("users");
      }
      toast({
        variant: "success",
        title: "Logout Successful",
        description: "User logged out successfully"
      });
    },
  },
});


export const { handleLogin, handleLogout } = authSlice.actions;
export default authSlice.reducer;
