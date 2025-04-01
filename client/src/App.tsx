import { Switch, Route } from "wouter";
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
  const { user } = useAuth();
  
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      
      {/* Protected routes for all users */}
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/discover" component={Discover} />
      <ProtectedRoute path="/library" component={Library} />
      <ProtectedRoute path="/profile" component={Profile} />
      <ProtectedRoute path="/subscriptions" component={Subscriptions} />
      
      {/* Athlete-specific routes */}
      <Route path="/studio">{user?.role === "athlete" ? <Studio /> : <NotFound />}</Route>
      <Route path="/studio/:projectId">{user?.role === "athlete" ? <Studio /> : <NotFound />}</Route>
      <Route path="/studio/join/:code">{user?.role === "athlete" ? <Studio /> : <NotFound />}</Route>
      <Route path="/uploads">{user?.role === "athlete" ? <Uploads /> : <NotFound />}</Route>
      <Route path="/earnings">{user?.role === "athlete" ? <Earnings /> : <NotFound />}</Route>
      <Route path="/athlete-verification">{user && user.role !== "admin" ? <AthleteVerification /> : <NotFound />}</Route>
      
      {/* Admin-specific routes */}
      <Route path="/admin/verifications">{user?.role === "admin" ? <VerificationsAdmin /> : <NotFound />}</Route>
      <Route path="/admin/content-moderation">{user?.role === "admin" ? <ContentModerationAdmin /> : <NotFound />}</Route>
      <Route path="/admin/user-management">{user?.role === "admin" ? <UserManagementAdmin /> : <NotFound />}</Route>
      
      {/* Fallback to 404 */}
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
