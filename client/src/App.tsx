import React, { useState, useEffect } from "react";
import { Switch, Route, Link } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./hooks/use-auth";
import { Button } from "@/components/ui/button";

// Import pages
import StudioPage from "@/pages/studio-page";
import BandLabStudio from "@/pages/studio-page-new";
import PremiumStudio from "@/pages/premium-studio";
import EnhancedStudio from "@/pages/enhanced-studio";
import DiscoverPage from "@/pages/discover-page";
import ProfilePage from "@/pages/profile-page";
import DashboardPage from "@/pages/dashboard";

// Create a query client
const queryClient = new QueryClient();

// Dashboard page
const Dashboard = () => {
  const { user, logoutMutation } = useAuth();
  
  return (
    <div className="px-4">
      {/* Live Now Section */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">Live Now</h2>
        <div className="bg-zinc-900 rounded-lg overflow-hidden relative">
          <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold py-1 px-2 rounded">
            LIVE
          </div>
          <div className="h-48 w-full bg-zinc-800 flex items-center justify-center">
            <span className="text-zinc-500">Live stream preview</span>
          </div>
        </div>
      </section>
      
      {/* Trending Tracks */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">Trending Tracks</h2>
        <div className="space-y-3">
          <div className="bg-zinc-900 rounded-lg p-3 flex items-center">
            <div className="w-12 h-12 bg-zinc-800 rounded mr-3 flex-shrink-0"></div>
            <div className="flex-grow min-w-0">
              <h3 className="font-medium text-sm">Game Day Vibes</h3>
              <p className="text-xs text-zinc-400">Marcus Thompson</p>
              <div className="flex items-center mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-zinc-400 mr-1">
                  <path d="M10 3.75a.75.75 0 00-1.264-.546L4.703 7H3.167a.75.75 0 00-.7.48A6.985 6.985 0 002 10c0 .887.165 1.737.468 2.52.111.29.39.48.7.48h1.535l4.033 3.796A.75.75 0 0010 16.25V3.75zM15.95 5.05a.75.75 0 00-1.06 1.061 5.5 5.5 0 011.06 3.389 5.5 5.5 0 01-1.06 3.389.75.75 0 101.06 1.061 7 7 0 001.5-4.45 7 7 0 00-1.5-4.45z" />
                </svg>
                <span className="text-xs text-zinc-400">125K plays</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="text-zinc-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-1.9C4.045 12.733 2 10.352 2 7.5a4.5 4.5 0 018-2.828A4.5 4.5 0 0118 7.5c0 2.852-2.044 5.233-3.885 6.82a22.049 22.049 0 01-3.744 2.582l-.019.01-.005.003h-.002a.739.739 0 01-.69.001l-.002-.001z" />
                </svg>
              </button>
              <button className="text-zinc-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M13 4.5a2.5 2.5 0 11.702 1.737L6.97 9.604a2.518 2.518 0 010 .792l6.733 3.367a2.5 2.5 0 11-.671 1.341l-6.733-3.367a2.5 2.5 0 110-3.475l6.733-3.366A2.52 2.52 0 0113 4.5z" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="bg-zinc-900 rounded-lg p-3 flex items-center">
            <div className="w-12 h-12 bg-zinc-800 rounded mr-3 flex-shrink-0"></div>
            <div className="flex-grow min-w-0">
              <h3 className="font-medium text-sm">Championship Flow</h3>
              <p className="text-xs text-zinc-400">Sarah Williams</p>
              <div className="flex items-center mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-zinc-400 mr-1">
                  <path d="M10 3.75a.75.75 0 00-1.264-.546L4.703 7H3.167a.75.75 0 00-.7.48A6.985 6.985 0 002 10c0 .887.165 1.737.468 2.52.111.29.39.48.7.48h1.535l4.033 3.796A.75.75 0 0010 16.25V3.75zM15.95 5.05a.75.75 0 00-1.06 1.061 5.5 5.5 0 011.06 3.389 5.5 5.5 0 01-1.06 3.389.75.75 0 101.06 1.061 7 7 0 001.5-4.45 7 7 0 00-1.5-4.45z" />
                </svg>
                <span className="text-xs text-zinc-400">98K plays</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="text-zinc-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-1.9C4.045 12.733 2 10.352 2 7.5a4.5 4.5 0 018-2.828A4.5 4.5 0 0118 7.5c0 2.852-2.044 5.233-3.885 6.82a22.049 22.049 0 01-3.744 2.582l-.019.01-.005.003h-.002a.739.739 0 01-.69.001l-.002-.001z" />
                </svg>
              </button>
              <button className="text-zinc-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M13 4.5a2.5 2.5 0 11.702 1.737L6.97 9.604a2.518 2.518 0 010 .792l6.733 3.367a2.5 2.5 0 11-.671 1.341l-6.733-3.367a2.5 2.5 0 110-3.475l6.733-3.366A2.52 2.52 0 0113 4.5z" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="bg-zinc-900 rounded-lg p-3 flex items-center">
            <div className="w-12 h-12 bg-zinc-800 rounded mr-3 flex-shrink-0"></div>
            <div className="flex-grow min-w-0">
              <h3 className="font-medium text-sm">Game Day Vibes</h3>
              <p className="text-xs text-zinc-400">Marcus Thompson</p>
              <div className="flex items-center mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-zinc-400 mr-1">
                  <path d="M10 3.75a.75.75 0 00-1.264-.546L4.703 7H3.167a.75.75 0 00-.7.48A6.985 6.985 0 002 10c0 .887.165 1.737.468 2.52.111.29.39.48.7.48h1.535l4.033 3.796A.75.75 0 0010 16.25V3.75zM15.95 5.05a.75.75 0 00-1.06 1.061 5.5 5.5 0 011.06 3.389 5.5 5.5 0 01-1.06 3.389.75.75 0 101.06 1.061 7 7 0 001.5-4.45 7 7 0 00-1.5-4.45z" />
                </svg>
                <span className="text-xs text-zinc-400">65K plays</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="text-zinc-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-1.9C4.045 12.733 2 10.352 2 7.5a4.5 4.5 0 018-2.828A4.5 4.5 0 0118 7.5c0 2.852-2.044 5.233-3.885 6.82a22.049 22.049 0 01-3.744 2.582l-.019.01-.005.003h-.002a.739.739 0 01-.69.001l-.002-.001z" />
                </svg>
              </button>
              <button className="text-zinc-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M13 4.5a2.5 2.5 0 11.702 1.737L6.97 9.604a2.518 2.518 0 010 .792l6.733 3.367a2.5 2.5 0 11-.671 1.341l-6.733-3.367a2.5 2.5 0 110-3.475l6.733-3.366A2.52 2.52 0 0113 4.5z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Popular Athletes */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">Popular Athletes</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-zinc-900 rounded-lg overflow-hidden">
            <div className="h-32 bg-zinc-800 flex items-center justify-center">
              <span className="text-zinc-500">Profile image</span>
            </div>
            <div className="p-2">
              <h3 className="font-medium text-sm">Marcus Thompson</h3>
              <p className="text-xs text-zinc-400">Basketball</p>
              <div className="flex justify-between items-center mt-2">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-zinc-400 mr-1">
                    <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.655zM16.44 15.98a4.97 4.97 0 002.07-.654.78.78 0 00.357-.442 3 3 0 00-4.308-3.517 6.484 6.484 0 011.907 3.96 2.32 2.32 0 01-.026.654zM18 8a2 2 0 11-4 0 2 2 0 014 0zM5.304 16.19a.844.844 0 01-.277-.71 5 5 0 019.947 0 .843.843 0 01-.277.71A6.975 6.975 0 0110 18a6.974 6.974 0 01-4.696-1.81z" />
                  </svg>
                  <span className="text-xs text-zinc-400">1.2M</span>
                </div>
                <button className="bg-primary text-black text-xs font-medium py-1 px-4 rounded-full">
                  Follow
                </button>
              </div>
            </div>
          </div>
          
          <div className="bg-zinc-900 rounded-lg overflow-hidden">
            <div className="h-32 bg-zinc-800 flex items-center justify-center">
              <span className="text-zinc-500">Profile image</span>
            </div>
            <div className="p-2">
              <h3 className="font-medium text-sm">Sarah Williams</h3>
              <p className="text-xs text-zinc-400">Soccer</p>
              <div className="flex justify-between items-center mt-2">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-zinc-400 mr-1">
                    <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.655zM16.44 15.98a4.97 4.97 0 002.07-.654.78.78 0 00.357-.442 3 3 0 00-4.308-3.517 6.484 6.484 0 011.907 3.96 2.32 2.32 0 01-.026.654zM18 8a2 2 0 11-4 0 2 2 0 014 0zM5.304 16.19a.844.844 0 01-.277-.71 5 5 0 019.947 0 .843.843 0 01-.277.71A6.975 6.975 0 0110 18a6.974 6.974 0 01-4.696-1.81z" />
                  </svg>
                  <span className="text-xs text-zinc-400">890K</span>
                </div>
                <button className="bg-primary text-black text-xs font-medium py-1 px-4 rounded-full">
                  Follow
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Genres & Moods */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3">Genres & Moods</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-lg p-3">
            <h3 className="font-bold text-white">Workout</h3>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg p-3">
            <h3 className="font-bold text-white">Pre-Game</h3>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg p-3">
            <h3 className="font-bold text-white">Victory</h3>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg p-3">
            <h3 className="font-bold text-white">Focus</h3>
          </div>
        </div>
      </section>
      
      {/* Actions for development/testing */}
      <div className="fixed top-20 right-4 z-50 bg-zinc-800 p-3 rounded-lg shadow-lg opacity-50 hover:opacity-100 transition-opacity">
        <h3 className="text-sm font-bold mb-2">Dev Controls</h3>
        <div className="flex flex-col space-y-2">
          <Button size="sm" asChild><Link href="/studio">Studio</Link></Button>
          <Button 
            size="sm" 
            asChild 
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-none font-medium"
          >
            <Link href="/enhanced-studio">
              Enhanced Studio
              <span className="ml-1 text-xs animate-pulse">✨</span>
            </Link>
          </Button>
          <Button size="sm" asChild variant="outline"><Link href="/profile">Profile</Link></Button>
          <Button 
            size="sm"
            variant="destructive"
            onClick={() => logoutMutation.mutate()}
          >
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
};

// Profile Page
const Profile = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">Profile</h1>
    <p>This is your profile page.</p>
    <Button className="mt-4" asChild><Link href="/">Back to Dashboard</Link></Button>
  </div>
);

// Auth Page
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
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-md p-8 space-y-8 bg-zinc-900 rounded-lg shadow-lg">
        <div className="text-center">
          <div className="flex justify-center items-center mb-4">
            <span className="font-bold text-2xl text-white">BALL</span>
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mx-1">
              <span className="sr-only">Microphone</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-black">
                <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
              </svg>
            </div>
            <span className="font-bold text-2xl text-white">TALK</span>
          </div>
          <p className="text-zinc-400 mt-2">Sign in to access your studio</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Username</label>
            <input 
              className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-md text-white" 
              defaultValue="athlete"
              disabled
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Password</label>
            <input 
              className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-md text-white" 
              type="password" 
              defaultValue="password123"
              disabled
            />
          </div>
          
          <Button className="w-full bg-primary text-black hover:bg-primary/90" type="submit">
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
  const [activeTab, setActiveTab] = useState("home");
  
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
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800">
        <div className="container mx-auto py-3 px-4 flex justify-between items-center">
          <div className="flex items-center space-x-1">
            <span className="font-bold text-lg">BALL</span>
            <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center mx-0.5">
              <span className="sr-only">Microphone</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-black">
                <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
              </svg>
            </div>
            <span className="font-bold text-lg">TALK</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search athletes, tracks..." 
                className="bg-zinc-800 text-white rounded-full py-1 px-4 text-sm w-48 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <button className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto pb-16 pt-4">
        {children}
      </main>
      
      {/* Now Playing Bar (if a track is playing) */}
      <div className="fixed bottom-16 left-0 right-0 bg-zinc-900 border-t border-zinc-800 py-2 px-4">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-zinc-800 rounded-md mr-3 flex-shrink-0"></div>
          <div className="flex-grow min-w-0">
            <p className="font-medium text-sm truncate">Game Day Vibes</p>
            <p className="text-xs text-zinc-400 truncate">Marcus Thompson</p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-zinc-400 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 16.811c0 .864-.933 1.405-1.683.977l-7.108-4.062a1.125 1.125 0 010-1.953l7.108-4.062A1.125 1.125 0 0121 8.688v8.123zM11.25 16.811c0 .864-.933 1.405-1.683.977l-7.108-4.062a1.125 1.125 0 010-1.953L9.567 7.71a1.125 1.125 0 011.683.977v8.123z" />
              </svg>
            </button>
            <button className="bg-primary text-black h-8 w-8 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
              </svg>
            </button>
            <button className="text-zinc-400 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062A1.125 1.125 0 013 16.81V8.688zM12.75 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062a1.125 1.125 0 01-1.683-.977V8.688z" />
              </svg>
            </button>
            <button className="text-zinc-400 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800">
        <div className="grid grid-cols-4">
          <Link href="/" 
            className={`flex flex-col items-center py-2 ${activeTab === 'home' ? 'text-primary' : 'text-zinc-400'}`}
            onClick={() => setActiveTab('home')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
              <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75v4.5a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
            </svg>
            <span className="text-xs mt-0.5">Home</span>
          </Link>
          <Link href="/discover"
            className={`flex flex-col items-center py-2 ${activeTab === 'discover' ? 'text-primary' : 'text-zinc-400'}`}
            onClick={() => setActiveTab('discover')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z" clipRule="evenodd" />
            </svg>
            <span className="text-xs mt-0.5">Discover</span>
          </Link>
          <Link href="/studio" 
            className={`flex flex-col items-center py-2 ${activeTab === 'live' ? 'text-primary' : 'text-zinc-400'}`}
            onClick={() => setActiveTab('live')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
              <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
            </svg>
            <span className="text-xs mt-0.5">Studio</span>
          </Link>
          <Link href="/profile" 
            className={`flex flex-col items-center py-2 ${activeTab === 'library' ? 'text-primary' : 'text-zinc-400'}`}
            onClick={() => setActiveTab('library')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M11.584 2.376a.75.75 0 01.832 0l9 6a.75.75 0 11-.832 1.248L12 3.901 3.416 9.624a.75.75 0 01-.832-1.248l9-6z" />
              <path fillRule="evenodd" d="M20.25 10.332v9.918H21a.75.75 0 010 1.5H3a.75.75 0 010-1.5h.75v-9.918a.75.75 0 01.634-.74A49.109 49.109 0 0112 9c2.59 0 5.134.202 7.616.592a.75.75 0 01.634.74zm-7.5 2.418a.75.75 0 00-1.5 0v6.75a.75.75 0 001.5 0v-6.75zm3-.75a.75.75 0 01.75.75v6.75a.75.75 0 01-1.5 0v-6.75a.75.75 0 01.75-.75zM9 12.75a.75.75 0 00-1.5 0v6.75a.75.75 0 001.5 0v-6.75z" clipRule="evenodd" />
              <path d="M12 7.875a1.125 1.125 0 100-2.25 1.125 1.125 0 000 2.25z" />
            </svg>
            <span className="text-xs mt-0.5">Library</span>
          </Link>
        </div>
      </nav>
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

// Main App component
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Switch>
          {/* Auth route */}
          <Route path="/auth">
            <AuthRedirect>
              <AuthPage />
            </AuthRedirect>
          </Route>
          
          {/* Dashboard */}
          <Route path="/">
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          </Route>
          
          {/* Studio Routes */}
          <Route path="/studio">
            <ProtectedRoute>
              <StudioPage />
            </ProtectedRoute>
          </Route>
          
          <Route path="/studio/:projectId">
            <ProtectedRoute>
              <StudioPage />
            </ProtectedRoute>
          </Route>
          
          {/* Enhanced Studio route */}
          <Route path="/enhanced-studio">
            <ProtectedRoute>
              <EnhancedStudio />
            </ProtectedRoute>
          </Route>
          
          {/* Profile */}
          <Route path="/profile">
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          </Route>
          
          {/* Discover */}
          <Route path="/discover">
            <ProtectedRoute>
              <DiscoverPage />
            </ProtectedRoute>
          </Route>
          
          {/* 404 Not Found */}
          <Route>
            <div className="p-8 bg-black text-white min-h-screen">
              <h1 className="text-2xl font-bold mb-4">404 - Not Found</h1>
              <p>The page you're looking for doesn't exist.</p>
              <Button className="mt-4 bg-primary text-black" asChild>
                <Link href="/">Back to Dashboard</Link>
              </Button>
            </div>
          </Route>
        </Switch>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
export default App;
