import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Types for user authentication
interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: "fan" | "athlete" | "admin";
  profileImage: string | null;
  bio: string | null;
  verificationStatus: "pending" | "approved" | "rejected" | null;
  subscriptionTier: "bronze" | "silver" | "gold" | null;
  coverImage: string | null;
  createdAt: Date | null;
  lastLoginAt: Date | null;
  location: string | null;
  socialLinks: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

interface LoginData {
  username: string;
  password: string;
}

interface RegisterData {
  username: string;
  password: string;
  email: string;
  fullName: string;
  role: "fan" | "athlete" | "admin";
}

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  registerMutation: any;
  loginMutation: any;
  logoutMutation: any;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current user
  const { data: user, error, isLoading } = useQuery({
    queryKey: ["/api/user"],
    retry: 1, // Only retry once to avoid too many failed requests
    refetchOnWindowFocus: false, // No need to refetch when focus changes
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await apiRequest("POST", "/api/register", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Registration failed");
      }
      return await response.json();
    },
    onSuccess: (data: User) => {
      queryClient.setQueryData(["/api/user"], data);
      toast({
        title: "Registration successful",
        description: `Welcome to Athlete Sound, ${data.fullName}!`,
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

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await apiRequest("POST", "/api/login", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }
      return await response.json();
    },
    onSuccess: (data: User) => {
      queryClient.setQueryData(["/api/user"], data);
      toast({
        title: "Login successful",
        description: `Welcome back, ${data.fullName}!`,
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

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/logout");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Logout failed");
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
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

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        error,
        registerMutation,
        loginMutation,
        logoutMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}