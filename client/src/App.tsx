import React, { useState, useEffect } from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import Discover from "@/pages/discover";
import Library from "@/pages/library";
import Studio from "@/pages/studio";
import Uploads from "@/pages/uploads";
import Earnings from "@/pages/earnings";
import Profile from "@/pages/profile";
import Subscriptions from "@/pages/subscriptions";
import AthleteVerification from "@/pages/athlete-verification";
import VerificationsAdmin from "@/pages/admin/verifications";
import ContentModerationAdmin from "@/pages/admin/content-moderation";
import UserManagementAdmin from "@/pages/admin/user-management";
import { AuthProvider, useAuth } from "./hooks/use-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";

// Create a client
const queryClient = new QueryClient();

// Simple protected route that redirects to /auth if not authenticated
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      setShouldRedirect(true);
    }
  }, [user, isLoading]);

  useEffect(() => {
    if (shouldRedirect) {
      setLocation("/auth");
    }
  }, [shouldRedirect, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return <AppLayout>{children}</AppLayout>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Switch>
          <Route path="/auth">
            <AuthPage />
          </Route>

          <Route path="/">
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          </Route>

          <Route path="/discover">
            <Discover />
          </Route>

          <Route path="/library">
            <ProtectedRoute>
              <Library />
            </ProtectedRoute>
          </Route>

          <Route path="/profile">
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          </Route>

          <Route path="/subscriptions">
            <ProtectedRoute>
              <Subscriptions />
            </ProtectedRoute>
          </Route>

          <Route path="/studio">
            <ProtectedRoute>
              <Studio />
            </ProtectedRoute>
          </Route>

          <Route path="/studio/join/:code">
            <ProtectedRoute>
              <Studio />
            </ProtectedRoute>
          </Route>

          <Route path="/studio/:projectId">
            <ProtectedRoute>
              <Studio />
            </ProtectedRoute>
          </Route>

          <Route path="/uploads">
            <ProtectedRoute>
              <Uploads />
            </ProtectedRoute>
          </Route>

          <Route path="/earnings">
            <ProtectedRoute>
              <Earnings />
            </ProtectedRoute>
          </Route>

          <Route path="/athlete-verification">
            <ProtectedRoute>
              <AthleteVerification />
            </ProtectedRoute>
          </Route>

          <Route path="/admin/verifications">
            <ProtectedRoute>
              <VerificationsAdmin />
            </ProtectedRoute>
          </Route>

          <Route path="/admin/content-moderation">
            <ProtectedRoute>
              <ContentModerationAdmin />
            </ProtectedRoute>
          </Route>

          <Route path="/admin/user-management">
            <ProtectedRoute>
              <UserManagementAdmin />
            </ProtectedRoute>
          </Route>

          <Route>
            <NotFound />
          </Route>
        </Switch>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
