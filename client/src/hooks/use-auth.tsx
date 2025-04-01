import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
} from "@tanstack/react-query";
import { insertUserSchema, User, LoginData } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: ReturnType<typeof useLoginMutation>;
  logoutMutation: ReturnType<typeof useLogoutMutation>;
  registerMutation: ReturnType<typeof useRegisterMutation>;
};

// Define schemas
const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterData = z.infer<typeof registerSchema>;

// Custom hooks for mutations
function useLoginMutation() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Logged in successfully",
        description: `Welcome back, ${user.fullName || user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

function useRegisterMutation() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (userData: RegisterData) => {
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...userDataWithoutConfirm } = userData;
      const res = await apiRequest("POST", "/api/register", userDataWithoutConfirm);
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Registration successful",
        description: `Welcome to Athlete Sound, ${user.fullName || user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

function useLogoutMutation() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logged out successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Create default values for the mutations
const defaultLoginMutation = {
  mutate: () => {},
  isPending: false,
  isSuccess: false,
  isError: false,
  error: null,
  data: null,
  reset: () => {},
  status: 'idle',
  variables: null,
  failureCount: 0,
  failureReason: null,
  mutateAsync: async () => ({ id: 0 } as User)
} as ReturnType<typeof useLoginMutation>;

const defaultRegisterMutation = {
  mutate: () => {},
  isPending: false,
  isSuccess: false,
  isError: false,
  error: null,
  data: null,
  reset: () => {},
  status: 'idle',
  variables: null,
  failureCount: 0,
  failureReason: null,
  mutateAsync: async () => ({ id: 0 } as User)
} as ReturnType<typeof useRegisterMutation>;

const defaultLogoutMutation = {
  mutate: () => {},
  isPending: false,
  isSuccess: false,
  isError: false,
  error: null,
  data: null,
  reset: () => {},
  status: 'idle',
  variables: null,
  failureCount: 0,
  failureReason: null,
  mutateAsync: async () => {}
} as ReturnType<typeof useLogoutMutation>;

// Default auth context with no user logged in
const defaultAuthContext: AuthContextType = {
  user: null,
  isLoading: false,
  error: null,
  loginMutation: defaultLoginMutation,
  registerMutation: defaultRegisterMutation,
  logoutMutation: defaultLogoutMutation,
};

export const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();
  const logoutMutation = useLogoutMutation();

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        error: error as Error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
