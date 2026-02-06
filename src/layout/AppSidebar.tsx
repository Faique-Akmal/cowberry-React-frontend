import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";

import { PiUsersThreeBold } from "react-icons/pi";
import {
  CalenderIcon,
  ChatIcon,
  ChevronDownIcon,
  GridIcon,
  PlugInIcon,
  UserCircleIcon,
} from "../icons";

import { IoPersonAddOutline } from "react-icons/io5";

import { MdOutlineAdd } from "react-icons/md";

import { useSidebar } from "../context/SidebarContext";
import { MdAnnouncement } from "react-icons/md";
import SidebarWidget from "./SidebarWidget";
// import { MdAppRegistration } from "react-icons/md";
// import { FaHouseChimneyUser } from "react-icons/fa6";
import { MdListAlt } from "react-icons/md";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";

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
    isMobileOpen,
    isHovered,
    setIsHovered,
    toggleMobileSidebar,
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
      icon: <GridIcon />,
      name: t("menu.dashboard"),
      path: "/home",
      role: ["admin", "department_head", "zonalmanager", "manager", "hr"],
    },
    {
      icon: <ChatIcon />,
      name: t("menu.chat"),
      path: "/chat",
      role: ["admin", "department_head", "zonalmanager", "manager", "hr"],
    },

    {
      icon: <UserCircleIcon />,
      name: t("menu.EmployeeCheckin"),
      path: "/employeecheckin",
      role: ["admin", "manager", "hr"],
    },
    {
      icon: <MdListAlt />,
      name: t("menu.TravelSessions"),
      path: "/tracking-admin",
      role: ["admin", "zonalmanager", "manager", "hr"],
    },
    {
      icon: <IoPersonAddOutline />,
      name: t("menu.registerUserForm"),
      path: "/user-register",
      role: ["admin", "hr"],
    },
    {
      icon: <MdOutlineAdd />,
      name: t("Leaves Management"),
      path: "/get-leaves",
      role: ["admin", "hr", "manager", "zonalmanager"],
    },
    // {
    //   icon: <MdOutlineAdd />,
    //   name: t("Add department"),
    //   path: "/add-department",
    // },
    // {
    //   icon: <MdOutlineAdd />,
    //   name: t("Add Zones"),
    //   path: "/add-zones",
    //   role: ["admin", "hr"],
    // },
    {
      icon: <MdOutlineAdd />,
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
      icon: <MdAnnouncement />,
      name: t("menu.announcement"),
      path: "/announcementList",
      role: ["admin", "hr"],
    },
    {
      icon: <PiUsersThreeBold />,
      name: t("menu.allUsers"),
      path: "/all-users",
      role: ["admin", "manager", "hr", "zonalmanager"],
    },
  ];

  const othersItems: NavItem[] = [
    {
      icon: <PlugInIcon />,
      name: t("menu.Authentication"),
      subItems: [
        { name: t("signIn"), path: "/signin" },
        { name: t("signOut"), path: "/logout" },
      ],
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
        .filter((nav) => hasAccess(nav.role)) // Use hasAccess function for main item
        .map((nav, index) => {
          const visibleSubItems = nav.subItems?.filter(
            (sub) => hasAccess(sub.role), // Use hasAccess function for sub items
          );

          if (
            nav.subItems &&
            (!visibleSubItems || visibleSubItems.length === 0)
          )
            return null;

          return (
            <li key={nav.name}>
              {visibleSubItems ? (
                <button
                  onClick={() => handleSubmenuToggle(index, menuType)}
                  className="menu-item group"
                >
                  <span className="menu-item-icon-size">{nav.icon}</span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className="menu-item-text">{nav.name}</span>
                  )}
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <ChevronDownIcon
                      className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                        openSubmenu?.type === menuType &&
                        openSubmenu?.index === index
                          ? "rotate-180 text-brand-500"
                          : ""
                      }`}
                    />
                  )}
                </button>
              ) : (
                nav.path && (
                  <Link
                    to={nav.path}
                    onClick={toggleMobileSidebar}
                    className="menu-item group"
                  >
                    <span className="menu-item-icon-size">{nav.icon}</span>
                    {(isExpanded || isHovered || isMobileOpen) && (
                      <span className="menu-item-text">{nav.name}</span>
                    )}
                  </Link>
                )
              )}

              {visibleSubItems && (isExpanded || isHovered || isMobileOpen) && (
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
                    {visibleSubItems.map((subItem) => (
                      <li key={subItem.name}>
                        <Link
                          to={subItem.path}
                          onClick={toggleMobileSidebar}
                          className={`menu-dropdown-item ${
                            isActive(subItem.path)
                              ? "menu-dropdown-item-active"
                              : "menu-dropdown-item-inactive"
                          }`}
                        >
                          {subItem.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
    </ul>
  );

  return (
    <aside
      style={{
        backgroundColor: themeConfig.sidebar.background
          ? `${themeConfig.sidebar.background}80`
          : "rgba(255, 255, 255, 0.15)",
        color: themeConfig.sidebar.text || undefined,
        backdropFilter: "blur(12px) saturate(180%)",
        WebkitBackdropFilter: "blur(12px) saturate(180%)",
        border: "1px solid rgba(255, 255, 255, 0.18)",
      }}
      className={`fixed top-0 left-0 h-screen z-50 transition-all duration-300
    text-gray-900 dark:text-blue-light-25
    shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]
    ${isExpanded || isMobileOpen || isHovered ? "w-[290px]" : "w-[90px]"}
    ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div
          className={`py-8 flex ${
            !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
          } px-5`}
        >
          <img src="lantern-banner.png" alt="Logo" width={170} height={0} />
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
          {(isExpanded || isHovered || isMobileOpen) && <SidebarWidget />}
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
