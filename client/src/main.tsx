import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./hooks/use-auth";
import { AudioPlayerProvider } from "./contexts/AudioPlayerContext";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AudioPlayerProvider>
        <App />
      </AudioPlayerProvider>
    </AuthProvider>
  </QueryClientProvider>
);
