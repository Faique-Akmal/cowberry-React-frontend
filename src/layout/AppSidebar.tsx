import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { PiUsersThreeBold } from "react-icons/pi";
import {
  ChatIcon,
  ChevronDownIcon,
  GridIcon,
  PlugInIcon,
  UserCircleIcon,
} from "../icons";
import { IoPersonAddOutline } from "react-icons/io5";
import { MdOutlineAdd, MdAnnouncement, MdListAlt } from "react-icons/md";
import { useSidebar } from "../context/SidebarContext";
import SidebarWidget from "./SidebarWidget";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import { FaCalendarAlt } from "react-icons/fa";

type SubItem = {
  name: string;
  path: string;
  pro?: boolean;
  new?: boolean;
  role?: string[];
};

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  role?: string[];
  subItems?: SubItem[];
};

const AppSidebar: React.FC = () => {
  const { themeConfig } = useTheme();
  const {
    isExpanded,
    isMobile,
    isMobileOpen,
    toggleMobileSidebar,
    closeMobileSidebar,
  } = useSidebar();
  const location = useLocation();

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {},
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname],
  );

  // Helper function to normalize roles to lowercase
  const normalizeRole = (role: string | null): string | null => {
    return role ? role.toLowerCase().trim() : null;
  };

  // Get and normalize user role
  const rawUserRole = localStorage.getItem("userRole");
  const userRole = normalizeRole(rawUserRole);

  // Helper function to check if user has access to an item
  const hasAccess = (itemRoles?: string[]): boolean => {
    if (!itemRoles || itemRoles.length === 0) return true;
    if (!userRole) return false;

    // Normalize item roles to lowercase for comparison
    const normalizedItemRoles = itemRoles.map((role) =>
      role.toLowerCase().trim(),
    );
    return normalizedItemRoles.includes(userRole);
  };

  const { t } = useTranslation();

  const navItems: NavItem[] = [
    {
      icon: <GridIcon className="text-lantern-blue-600" />,
      name: t("menu.dashboard"),
      path: "/home",
      role: ["admin", "headofdepartment", "zonalmanager", "manager", "hr"],
    },
    {
      icon: <ChatIcon className="text-lantern-blue-600" />,
      name: t("menu.chat"),
      path: "/chat",
      role: ["admin", "headofdepartment", "zonalmanager", "manager", "hr"],
    },

    {
      icon: <UserCircleIcon className="text-lantern-blue-600" />,
      name: t("menu.EmployeeCheckin"),
      path: "/employeecheckin",
      role: ["admin", "manager", "hr", "headofdepartment"],
    },
    {
      icon: <MdListAlt className="text-lantern-blue-600" />,
      name: t("menu.TravelSessions"),
      path: "/tracking-admin",
      role: ["admin", "zonalmanager", "manager", "hr", "headofdepartment"],
    },
    {
      icon: <MdOutlineAdd className="text-lantern-blue-600" />,
      name: t("Add / Manage"),
      subItems: [
        { name: t("Add Zones"), path: "/add-zones", role: ["admin", "hr"] },
        {
          name: t("Add department"),
          path: "/add-department",
          role: ["admin", "hr"],
        },
        { name: t("Add Role"), path: "/add-role", role: ["admin", "hr"] },
      ],
    },
    {
      icon: <MdAnnouncement className="text-lantern-blue-600" />,
      name: t("menu.announcement"),
      path: "/announcementList",
      role: ["admin", "hr", "ceo"],
    },

    {
      icon: <FaCalendarAlt className="text-lantern-blue-600" />,
      name: t("Leaves Management"),
      subItems: [
        {
          name: t("All Leaves"),
          path: "/get-leaves",
          role: ["admin", "hr", "manager", "zonalmanager"],
        },
        {
          name: t("Self Leaves"),
          path: "/getself-leaves",
          role: ["admin", "hr", "manager", "zonalmanager"],
        },
        {
          name: t("Apply Leave "),
          path: "/apply-leaves",
          role: ["admin", "hr", "manager", "zonalmanager"],
        },
      ],
    },
    {
      icon: <IoPersonAddOutline className="text-lantern-blue-600" />,
      name: t("menu.registerUserForm"),
      path: "/user-register",
      role: ["admin", "hr"],
    },
    {
      icon: <PiUsersThreeBold className="text-lantern-blue-600" />,
      name: t("menu.allUsers"),
      path: "/all-users",
      role: ["admin", "manager", "hr", "zonalmanager", "headofdepartment"],
    },
  ];

  const othersItems: NavItem[] = [
    {
      icon: <PlugInIcon className="text-red-700" />,
      name: "LogOut",
      path: "/logout",
    },
  ];

  useEffect(() => {
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : othersItems;
      items.forEach((nav, index) => {
        nav.subItems?.forEach((subItem) => {
          if (isActive(subItem.path)) {
            setOpenSubmenu({ type: menuType as "main" | "others", index });
            submenuMatched = true;
          }
        });
      });
    });

    if (!submenuMatched) setOpenSubmenu(null);
  }, [location, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  // Close mobile sidebar when navigating or clicking outside on mobile/tablet
  const handleNavigation = (path: string) => {
    if (isMobileOpen) {
      toggleMobileSidebar();
    }
  };

  // Close sidebar when clicking outside on tablet/mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const sidebar = document.querySelector(".sidebar-container");
      const toggleButton = document.querySelector(".sidebar-toggle-button");

      // Check if sidebar is open on mobile/tablet and click is outside
      if (
        isMobileOpen &&
        sidebar &&
        !sidebar.contains(target) &&
        !toggleButton?.contains(target)
      ) {
        toggleMobileSidebar();
      }
    };

    // Only add listener on mobile/tablet devices
    if (isMobile) {
      document.addEventListener("mousedown", handleClickOutside);
      // For touch devices
      document.addEventListener("touchstart", handleClickOutside as any);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside as any);
    };
  }, [isMobileOpen, isMobile, toggleMobileSidebar]);

  // Handle window resize for tablet orientation changes
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const isTablet = width >= 768 && width <= 1024;

      // If it's a tablet and sidebar is open in mobile mode, keep it open
      // If resizing from tablet to desktop, ensure proper state
      if (!isMobile && width >= 1024 && isMobileOpen) {
        // Transition from tablet/mobile to desktop
        toggleMobileSidebar();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobile, isMobileOpen, toggleMobileSidebar]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prev) =>
      prev?.type === menuType && prev.index === index
        ? null
        : { type: menuType, index },
    );
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-4">
      {items
        .filter((nav) => hasAccess(nav.role))
        .map((nav, index) => {
          const visibleSubItems = nav.subItems?.filter((sub) =>
            hasAccess(sub.role),
          );
          const isItemActive = nav.path ? isActive(nav.path) : false;
          const isParentOfActiveSubmenu = nav.subItems?.some(
            (subItem) => hasAccess(subItem.role) && isActive(subItem.path),
          );

          if (
            nav.subItems &&
            (!visibleSubItems || visibleSubItems.length === 0)
          )
            return null;

          return (
            <li key={nav.name} className="relative">
              {visibleSubItems ? (
                <>
                  <button
                    onClick={() => handleSubmenuToggle(index, menuType)}
                    className={`menu-item group relative transition-all duration-300 w-full text-left ${
                      isParentOfActiveSubmenu
                        ? "bg-blue-300 dark:from-blue-400/20 dark:to-blue-500/20 text-lantern-blue-600"
                        : ""
                    }`}
                  >
                    <span className="menu-item-icon-size">{nav.icon}</span>
                    {(isExpanded || isMobileOpen) && (
                      <span className="menu-item-text">{nav.name}</span>
                    )}
                    {(isExpanded || isMobileOpen) && (
                      <ChevronDownIcon
                        className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                          openSubmenu?.type === menuType &&
                          openSubmenu?.index === index
                            ? "rotate-180 text-blue-400"
                            : ""
                        }`}
                      />
                    )}
                  </button>

                  {visibleSubItems && (isExpanded || isMobileOpen) && (
                    <div
                      ref={(el) => {
                        subMenuRefs.current[`${menuType}-${index}`] = el;
                      }}
                      className="overflow-hidden transition-all duration-300"
                      style={{
                        height:
                          openSubmenu?.type === menuType &&
                          openSubmenu?.index === index
                            ? `${subMenuHeight[`${menuType}-${index}`]}px`
                            : "0px",
                      }}
                    >
                      <ul className="mt-2 space-y-1 ml-9">
                        {visibleSubItems.map((subItem) => {
                          const isSubItemActive = isActive(subItem.path);
                          return (
                            <li key={subItem.name} className="relative">
                              <Link
                                to={subItem.path}
                                onClick={() => handleNavigation(subItem.path)}
                                className={`menu-dropdown-item relative transition-all duration-300 block ${
                                  isSubItemActive
                                    ? "bg-blue-300 dark:from-blue-400/20 dark:to-blue-500/20 text-lantern-blue-600 dark:text-blue-300 font-medium"
                                    : "menu-dropdown-item-inactive"
                                }`}
                              >
                                {isSubItemActive && (
                                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-r-full"></div>
                                )}
                                {subItem.name}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                nav.path && (
                  <Link
                    to={nav.path}
                    onClick={() => handleNavigation(nav.path!)}
                    className={`menu-item group relative flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300 w-full
                    ${
                      isItemActive
                        ? "bg-blue-100 dark:bg-blue-900/30 text-lantern-blue-600 dark:text-blue-300"
                        : "hover:bg-gray-100 dark:hover:bg-white/10"
                    }`}
                  >
                    <span className="menu-item-icon-size">{nav.icon}</span>
                    {(isExpanded || isMobileOpen) && (
                      <span className="menu-item-text">{nav.name}</span>
                    )}
                  </Link>
                )
              )}
            </li>
          );
        })}
    </ul>
  );

  return (
    <>
      {/* Overlay for mobile/tablet devices */}
      {isMobileOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
          onClick={toggleMobileSidebar}
          style={{ backdropFilter: "blur(4px)" }}
        />
      )}

      <aside
        className={`sidebar-container fixed top-0 rounded-r-2xl left-0 h-screen z-50 transition-all duration-300
          text-gray-900 dark:text-blue-light-25
          shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]
          ${isExpanded || isMobileOpen ? "w-[240px]" : "lg:w-[80px] w-[240px]"}
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
        style={{
          backgroundColor: themeConfig.sidebar.background
            ? `${themeConfig.sidebar.background}80`
            : "rgba(255, 255, 255, 0.15)",
          color: themeConfig.sidebar.text || undefined,
          backdropFilter: "blur(12px) saturate(180%)",
          WebkitBackdropFilter: "blur(12px) saturate(180%)",
          border: "1px solid rgba(255, 255, 255, 0.18)",
        }}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div
            className={`py-8 flex ${
              !isExpanded && !isMobile
                ? "lg:justify-center justify-start"
                : "justify-start"
            } px-5`}
          >
            {isExpanded || isMobileOpen ? (
              <img
                src="lantern-banner.png"
                alt="Logo"
                className="object-cover"
                width={170}
              />
            ) : (
              <img
                src="lantern-logo.png"
                alt="Logo"
                className="object-cover"
                width={170}
              />
            )}
          </div>

          {/* Scrollable Area */}
          <div className="flex-1 overflow-y-auto no-scrollbar px-5">
            <nav className="mb-6">
              <div className="flex flex-col gap-4">
                <div>
                  <h2 className="text-xs text-gray-600 uppercase mb-4">
                    {t("Menu")}
                  </h2>
                  {renderMenuItems(navItems, "main")}
                </div>
                <div>
                  <h2 className="text-xs text-gray-600 uppercase mb-4">
                    {t("Others")}
                  </h2>
                  {renderMenuItems(othersItems, "others")}
                </div>
              </div>
            </nav>
            {(isExpanded || isMobileOpen) && <SidebarWidget />}
          </div>
        </div>
      </aside>
    </>
  );
};

export default AppSidebar;
