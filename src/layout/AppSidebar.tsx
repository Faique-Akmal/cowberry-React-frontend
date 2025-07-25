import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import {
  
  CalenderIcon,
  ChatIcon,
  ChevronDownIcon,
  GridIcon,
 
  ListIcon,

  PlugInIcon,
  TableIcon,
  UserCircleIcon,
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
import SidebarWidget from "./SidebarWidget";





interface UserProfile {

  role: string;
 
}


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

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    subItems: [
      { name: "Dashboard", path: "/home", role: ["admin" , "department_head" ,"manager" , "hr"] },
      { name: "Employee Dashboard", path: "/employee-dashboard", role: ["employee"] },
    ],
  },
  {
    icon: <CalenderIcon />,
    name: "Calendar",
    path: "/calendar",
    role: ["admin" , "department_head" ,"manager" , "hr"],
  },
  {
    icon: <UserCircleIcon />,
    name: "User Profile",
    path: "/profile",
    role: ["admin" ,"employee", "department_head" ,"manager" , "hr"],
  },
  {
    icon: <ChatIcon />,
    name: "Chat",
    path: "/chat",
    role: ["admin", "employee" , "department_head" ,"manager" , "hr"],
  },
  {
    name: "Employee Attandance",
    icon: <ListIcon />,
    subItems: [
      // { name: "My Tasks", path: "/task-show-page", role: ["employee"] },
      { name: "Attandance Start", path: "/attandanceStart-page", role: ["employee"] },
      { name: "Attandance END", path: "/attandanceEnd-page", role: ["employee"] },
      // { name: "location ", path: "/user-location", role: ["employee"] },
      // { name: "Task-Calendar", path: "/task-calendar", role: ["employee"] },
    ],
  },
  {
    name: "Forms",
    icon: <TableIcon />,
    subItems: [
      { name: "Users List", path: "/basic-tables", role: ["admin", "department_head" ,"manager" , "hr"] },
      { name: "Register User form", path: "/user-register", role: ["admin" , "department_head" ,"manager" , "hr"] },
      { name: "Assign Task form", path: "/assign-task-page", role: ["admin" , "department_head" ,"manager" , "hr"] },
      { name: "Task Manager", path: "/admin-task-manager", role: ["admin" , "department_head" ,"manager" , "hr"] },
      { name: "Attandance Start list ", path: "/attandance-start-admin", role: ["admin" , "department_head" ,"manager" , "hr"] },
    ],
  },
  {
    icon: <CalenderIcon />,
    name: "Task-Calendar",
    path: "/task-calendar",
    role: ["employee"],
  },
   {
    icon: <CalenderIcon />,
    name: "My Tasks",
    path: "/task-show-page",
    role: ["employee"],
  },
  {
    icon: <CalenderIcon />,
    name: "Employee Tracker",
    path: "/live-tracking",
     role: ["admin" , "department_head" ,"manager" , "hr"] 
   
  },
   
  // {
  //   name: "Pages",
  //   icon: <PageIcon />,
  //   subItems: [
  //     { name: "Blank Page", path: "/blank", role: ["admin", "employee"] },
  //     { name: "404 Error", path: "/error-404", role: ["admin", "employee"] },
  //   ],
  // },
];

const othersItems: NavItem[] = [
  // {
  //   icon: <PieChartIcon />,
  //   name: "Charts",
  //   subItems: [
  //     { name: "Line Chart", path: "/line-chart", role: ["admin"] },
  //     { name: "Bar Chart", path: "/bar-chart", role: ["admin"] },
  //   ],
  // },
  // {
  //   icon: <BoxCubeIcon />,
  //   name: "UI Elements",
  //   subItems: [
  //     { name: "Alerts", path: "/alerts", role: ["admin"] },
  //     { name: "Avatar", path: "/avatars", role: ["admin"] },
  //     { name: "Badge", path: "/badge", role: ["admin"] },
  //     { name: "Buttons", path: "/buttons", role: ["admin"] },
  //     { name: "Images", path: "/images", role: ["admin"] },
  //     { name: "Videos", path: "/videos", role: ["admin"] },
  //   ],
  // },
  {
    icon: <PlugInIcon />,
    name: "Authentication",
    subItems: [
      { name: "Sign In", path: "/signin",  },
      // { name: "Sign Up", path: "/signup",  },
      { name: "Log Out", path: "/logout",  },
    ],
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();

  const [openSubmenu, setOpenSubmenu] = useState<{ type: "main" | "others"; index: number } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback((path: string) => location.pathname === path, [location.pathname]);
  const userRole = localStorage.getItem("userRole" );



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
      prev?.type === menuType && prev.index === index ? null : { type: menuType, index }
    );
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-4">
      {items
        .filter(nav => !nav.role || nav.role.includes(userRole)) // Main item role check
        .map((nav, index) => {
          const visibleSubItems = nav.subItems?.filter(
            sub => !sub.role || sub.role.includes(userRole)
          );

          if (nav.subItems && (!visibleSubItems || visibleSubItems.length === 0)) return null;

          return (
            <li key={nav.name}>
              {visibleSubItems ? (
                <button
                  onClick={() => handleSubmenuToggle(index, menuType)}
                  className="menu-item group"
                >
                  <span className="menu-item-icon-size">{nav.icon}</span>
                  {(isExpanded || isHovered || isMobileOpen) && <span className="menu-item-text">{nav.name}</span>}
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <ChevronDownIcon
                      className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                        openSubmenu?.type === menuType && openSubmenu?.index === index
                          ? "rotate-180 text-brand-500"
                          : ""
                      }`}
                    />
                  )}
                </button>
              ) : (
                nav.path && (
                  <Link to={nav.path} className="menu-item group">
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
                      openSubmenu?.type === menuType && openSubmenu?.index === index
                        ? `${subMenuHeight[`${menuType}-${index}`]}px`
                        : "0px",
                  }}
                >
                  <ul className="mt-2 space-y-1 ml-9">
                    {visibleSubItems.map((subItem) => (
                      <li key={subItem.name}>
                        <Link
                          to={subItem.path}
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
      className={`fixed top-0 px-5 left-0 bg-dashboard-brown-200 dark:bg-gray-900 border-r border-gray-200 dark:text-blue-light-25 dark:border-gray-800 h-screen z-50 transition-all duration-300
      ${isExpanded || isMobileOpen || isHovered ? "w-[290px]" : "w-[90px]"}
      ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
        <Link to="/">
          <img src="/images/logo/cowberry-logo.svg" alt="Logo" width={170} height={40} />
        </Link>
      </div>

      <div className="flex flex-col overflow-y-auto no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-xs text-gray-600 uppercase mb-4">Menu</h2>
              {renderMenuItems(navItems, "main")}
            </div>
            <div>
              <h2 className="text-xs text-gray-600 uppercase mb-4">Others</h2>
              {renderMenuItems(othersItems, "others")}
            </div>
          </div>
        </nav>
        {(isExpanded || isHovered || isMobileOpen) && <SidebarWidget />}
      </div>
    </aside>
  );
};

export default AppSidebar;