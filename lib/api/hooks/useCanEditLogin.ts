import { useMutation } from "@tanstack/react-query";
import { canEditLogin, CanEditLoginRequest, CanEditLoginResponse } from "../user/canEditLogin";

/**
 * Custom hook for verifying user credentials for edit permission
 */
export const useCanEditLogin = () => {
    return useMutation({
        mutationFn: (credentials: CanEditLoginRequest) => canEditLogin(credentials),
        mutationKey: ['canEditLogin'],
        onSuccess: (data) => {
            console.log('Can edit login verified:', data);
        },
        onError: (error) => {
            console.error('Can edit login failed:', error);
        },
    });
};

export default useCanEditLogin;
