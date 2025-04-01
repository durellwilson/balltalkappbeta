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

function App() {
  return (
    <>
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
        <ProtectedRoute path="/athlete-verification" component={AthleteVerification} />
        <ProtectedRoute path="/admin/verifications" component={VerificationsAdmin} />
        <ProtectedRoute path="/admin/content-moderation" component={ContentModerationAdmin} />
        <ProtectedRoute path="/admin/user-management" component={UserManagementAdmin} />
        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </>
  );
}

export default App;
