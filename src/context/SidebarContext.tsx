import { createContext, useContext, useState, useEffect } from "react";

type SidebarContextType = {
  isMobile: boolean;
  isExpanded: boolean;
  isMobileOpen: boolean;
  isHovered: boolean;
  activeItem: string | null;
  openSubmenu: string | null;
  toggleSidebar: () => void;
  toggleMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  setIsHovered: (isHovered: boolean) => void;
  setActiveItem: (item: string | null) => void;
  toggleSubmenu: (item: string) => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  // Improved function to detect mobile and tablet devices
  const checkIsMobileOrTablet = (): boolean => {
    const width = window.innerWidth;
    const userAgent = navigator.userAgent.toLowerCase();

    // Check for iPad (including iPad Mini)
    const isIPad =
      /ipad/.test(userAgent) ||
      ("ontouchstart" in window && /macintosh/.test(userAgent) && width >= 768);

    // Check for Android tablets
    const isAndroidTablet =
      /android/.test(userAgent) && !/mobile/.test(userAgent) && width >= 600;

    // Check for small mobile devices (phones)
    const isSmallMobile = width < 768;

    // Check for tablets (including iPad Mini)
    const isTablet =
      (isIPad || isAndroidTablet) && width >= 768 && width <= 1024;

    // Treat both mobile phones and tablets as "mobile" for sidebar behavior
    return isSmallMobile || isTablet;
  };

  useEffect(() => {
    const handleResize = () => {
      const mobileOrTablet = checkIsMobileOrTablet();
      const previousIsMobile = isMobile;

      setIsMobile(mobileOrTablet);

      // Auto-close mobile sidebar when switching to desktop
      if (!mobileOrTablet && isMobileOpen) {
        setIsMobileOpen(false);
      }

      // Reset expanded state when switching from mobile/tablet to desktop
      if (!mobileOrTablet && previousIsMobile) {
        setIsExpanded(true);
      }

      // Close mobile sidebar when rotating tablet from portrait to landscape
      // or when resizing window
      if (mobileOrTablet && isMobileOpen && window.innerWidth > 1024) {
        setIsMobileOpen(false);
      }
    };

    // Initial check
    handleResize();

    // Add event listener for resize
    window.addEventListener("resize", handleResize);

    // Also listen for orientation change on mobile/tablet devices
    window.addEventListener("orientationchange", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, [isMobile, isMobileOpen]);

  // Handle sidebar toggle for desktop
  const toggleSidebar = () => {
    if (!isMobile) {
      setIsExpanded((prev) => !prev);
    }
  };

  // Handle mobile/tablet sidebar toggle
  const toggleMobileSidebar = () => {
    if (isMobile) {
      setIsMobileOpen((prev) => !prev);

      // Prevent body scroll when sidebar is open on mobile/tablet
      if (!isMobileOpen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    }
  };

  // Close mobile sidebar
  const closeMobileSidebar = () => {
    if (isMobile && isMobileOpen) {
      setIsMobileOpen(false);
      document.body.style.overflow = "";
    }
  };

  // Clean up body overflow on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const toggleSubmenu = (item: string) => {
    setOpenSubmenu((prev) => (prev === item ? null : item));
  };

  // For mobile/tablet devices, isExpanded should always be false
  // because we use overlay sidebar instead of expanded/collapsed state
  const effectiveIsExpanded = isMobile ? false : isExpanded;

  return (
    <SidebarContext.Provider
      value={{
        isMobile,
        isExpanded: effectiveIsExpanded,
        isMobileOpen,
        isHovered,
        activeItem,
        openSubmenu,
        toggleSidebar,
        toggleMobileSidebar,
        closeMobileSidebar,
        setIsHovered,
        setActiveItem,
        toggleSubmenu,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};
