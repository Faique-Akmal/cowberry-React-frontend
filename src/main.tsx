import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "swiper/swiper-bundle.css";
import "flatpickr/dist/flatpickr.css";
import './i18n';
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import { BrowserRouter } from 'react-router-dom';

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <AppWrapper>
           <BrowserRouter>
      <App />
    </BrowserRouter>
        </AppWrapper>
      </ThemeProvider>
    </AuthProvider>
  </StrictMode>,
);
