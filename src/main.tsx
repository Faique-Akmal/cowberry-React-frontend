import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import 'leaflet/dist/leaflet.css';

import "./index.css";
import "swiper/swiper-bundle.css";
import "flatpickr/dist/flatpickr.css";

import App from "./App.tsx";
import { LocationTrackerProvider } from "./hooks/LocationTrackerProvider.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import { BrowserRouter } from 'react-router-dom';
import "./i18n.ts";
import { DataProvider } from "./context/DataProvider.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <LocationTrackerProvider>
          <AppWrapper>
            <BrowserRouter>
             <DataProvider>
               <App />
             </DataProvider>
            </BrowserRouter>
          </AppWrapper>
        </LocationTrackerProvider>
      </ThemeProvider>
    </AuthProvider>
  </StrictMode>,
);
