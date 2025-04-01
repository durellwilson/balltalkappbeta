import React, { useState, useEffect } from "react";
import { Switch, Route, Link } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./hooks/use-auth";
import { Button } from "@/components/ui/button";

// Create a query client
const queryClient = new QueryClient();

// Simple pages
const Dashboard = () => {
  const { user, logoutMutation } = useAuth();
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="bg-card rounded-lg shadow-sm p-4 mb-4">
        <h2 className="text-xl">Welcome, {user?.username || "User"}!</h2>
        <p className="text-muted-foreground">Role: {user?.role || "User"}</p>
      </div>
      
      <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
        <Button asChild><Link href="/studio">Studio</Link></Button>
        <Button asChild variant="outline"><Link href="/profile">Profile</Link></Button>
        <Button 
          variant="destructive"
          onClick={() => logoutMutation.mutate()}
        >
          Logout
        </Button>
      </div>
    </div>
  );
};

const Studio = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">Studio</h1>
    <p>Welcome to the studio page. Here you can create and manage your tracks.</p>
    <Button className="mt-4" asChild><Link href="/">Back to Dashboard</Link></Button>
  </div>
);

const Profile = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">Profile</h1>
    <p>This is your profile page.</p>
    <Button className="mt-4" asChild><Link href="/">Back to Dashboard</Link></Button>
  </div>
);

const AuthPage = () => {
  const { loginMutation } = useAuth();
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ 
      username: "athlete", 
      password: "password123" 
    });
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Athlete Sound</h1>
          <p className="text-muted-foreground mt-2">Sign in to continue</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Username</label>
            <input 
              className="w-full p-2 border rounded-md" 
              defaultValue="athlete"
              disabled
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <input 
              className="w-full p-2 border rounded-md" 
              type="password" 
              defaultValue="password123"
              disabled
            />
          </div>
          
          <Button className="w-full" type="submit">
            {loginMutation.isPending ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
};

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  
  useEffect(() => {
    if (!isLoading && !user) {
      setRedirectUrl("/auth");
    }
  }, [user, isLoading]);
  
  if (redirectUrl) {
    window.location.href = redirectUrl;
    return null;
  }
  
  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow-sm">
        <div className="container mx-auto py-4 px-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-primary-foreground font-bold">
              AS
            </div>
            <span className="font-bold text-lg">Athlete Sound</span>
          </div>
          <nav className="flex items-center space-x-4">
            <Link href="/">Dashboard</Link>
            <Link href="/studio">Studio</Link>
            <Link href="/profile">Profile</Link>
          </nav>
        </div>
      </header>
      <main className="container mx-auto py-6 px-4">
        {children}
      </main>
    </div>
  );
};

// Auth redirect
const AuthRedirect = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  
  useEffect(() => {
    if (!isLoading && user) {
      setRedirectUrl("/");
    }
  }, [user, isLoading]);
  
  if (redirectUrl) {
    window.location.href = redirectUrl;
    return null;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Switch>
          <Route path="/auth">
            <AuthRedirect>
              <AuthPage />
            </AuthRedirect>
          </Route>
          
          <Route path="/">
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          </Route>
          
          <Route path="/studio">
            <ProtectedRoute>
              <Studio />
            </ProtectedRoute>
          </Route>
          
          <Route path="/profile">
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          </Route>
          
          <Route>
            <div className="p-8">
              <h1 className="text-2xl font-bold mb-4">404 - Not Found</h1>
              <p>The page you're looking for doesn't exist.</p>
              <Button className="mt-4" asChild><Link href="/">Back to Dashboard</Link></Button>
            </div>
          </Route>
        </Switch>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
