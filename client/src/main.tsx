import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AudioPlayerProvider } from "./contexts/AudioPlayerContext";

createRoot(document.getElementById("root")!).render(
  <AudioPlayerProvider>
    <App />
  </AudioPlayerProvider>
);
