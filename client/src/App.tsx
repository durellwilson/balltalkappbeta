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
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/" component={Dashboard} />
      <Route path="/discover" component={Discover} />
      <Route path="/library" component={Library} />
      <Route path="/profile" component={Profile} />
      <Route path="/subscriptions" component={Subscriptions} />
      <Route path="/studio" component={Studio} />
      <Route path="/studio/join/:code" component={Studio} />
      <Route path="/studio/:projectId" component={Studio} />
      <Route path="/uploads" component={Uploads} />
      <Route path="/earnings" component={Earnings} />
      <Route path="/athlete-verification" component={AthleteVerification} />
      <Route path="/admin/verifications" component={VerificationsAdmin} />
      <Route path="/admin/content-moderation" component={ContentModerationAdmin} />
      <Route path="/admin/user-management" component={UserManagementAdmin} />
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
