import { Switch, Route, Redirect } from "wouter";
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
import { ProtectedRoute } from "./lib/protected-route";
import { useAuth } from "./hooks/use-auth";

function Router() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={Dashboard} />
      <Route path="/discover" component={Discover} />
      <ProtectedRoute path="/library" component={Library} />
      <ProtectedRoute path="/profile" component={Profile} />
      <ProtectedRoute path="/subscriptions" component={Subscriptions} />
      <ProtectedRoute path="/studio" component={Studio} />
      <ProtectedRoute path="/studio/join/:code" component={Studio} />
      <ProtectedRoute path="/studio/:projectId" component={Studio} />
      <ProtectedRoute path="/uploads" component={Uploads} />
      <ProtectedRoute path="/earnings" component={Earnings} />
      {user?.role === 'athlete' && (
        <ProtectedRoute path="/athlete-verification" component={AthleteVerification} />
      )}
      {user?.role === 'admin' && (
        <>
          <ProtectedRoute path="/admin/verifications" component={VerificationsAdmin} />
          <ProtectedRoute path="/admin/content-moderation" component={ContentModerationAdmin} />
          <ProtectedRoute path="/admin/user-management" component={UserManagementAdmin} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <>
      <Router />
      <Toaster />
    </>
  );
}

export default App;
