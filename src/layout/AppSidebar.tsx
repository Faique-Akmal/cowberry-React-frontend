import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { TbTableShare } from "react-icons/tb";
import { RiUserSharedFill } from "react-icons/ri";
import { PiUsersThreeBold } from "react-icons/pi";
// import  LogoutIcon from '@mui/icons-material/Logout';

// Assume these icons are imported from an icon library
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
import { MdAppRegistration } from "react-icons/md";
import { FaTasks } from "react-icons/fa";
// import { FaHouseChimneyUser } from "react-icons/fa6";
import { MdListAlt } from "react-icons/md";
import { useTranslation } from "react-i18next";


// interface UserProfile {

//   role: string;
 
// }


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

// const navItems: NavItem[] = [
//   {
//     icon: <GridIcon />,
//     name: "Dashboard",
//     subItems: [
//       { name: "Dashboard", path: "/home", role: ["admin" , "department_head" ,"manager" , "hr"] },
//       { name: "Employee Dashboard", path: "/employee-dashboard", role: ["employee"] },
//     ],
//   },
//   {
//     icon: <CalenderIcon />,
//     name: "Calendar",
//     path: "/calendar",
//     role: ["admin" , "department_head" ,"manager" , "hr"],
//   },
//   {
//     icon: <UserCircleIcon />,
//     name: "Profile",
//     path: "/profile",
//     role: ["admin" ,"employee", "department_head" ,"manager" , "hr"],
//   },
//   {
//     icon: <ChatIcon />,
//     name: "Chat",
//     path: "/chat",
//     role: ["admin", "employee" , "department_head" ,"manager" , "hr"],
//   },
//   {
//     name: "Attandance",
//     icon: <ListIcon />,
//     subItems: [
//       // { name: "My Tasks", path: "/task-show-page", role: ["employee"] },
//       { name: "Attandance Start", path: "/attandanceStart-page", role: ["employee"] },
//       { name: "Attandance END", path: "/attandanceEnd-page", role: ["employee"] },
//       // { name: "location ", path: "/user-location", role: ["employee"] },
//       // { name: "Task-Calendar", path: "/task-calendar", role: ["employee"] },
//     ],
//   },
//   {
//     name: "Forms",
//     icon: <TbTableShare  />,
//     subItems: [
//       // { name: "Users List", path: "/basic-tables", role: ["admin", "department_head" ,"manager" , "hr"] },
//       // { name: "Register User form", path: "/user-register", role: ["admin" , "department_head" ,"manager" , "hr"] },
//       { name: "Assign Task form", path: "/assign-task-page", role: ["admin" , "department_head" ,"manager" , "hr"] },
//       // { name: "Task Manager", path: "/admin-task-manager", role: ["admin" , "department_head" ,"manager" , "hr"] },
//       // { name: "Attandance Start list ", path: "/attandance-start-admin", role: ["admin" , "department_head" ,"manager" , "hr"] },
//     ],
//   },

//    {
//     icon: <MdListAlt />,
//     name: "Attandance list",
//     path: "/attandance-start-admin",
//     role: ["admin" , "department_head" ,"manager" , "hr" , "executive"] ,
//     },
    
//   {
//     icon: <MdAppRegistration />,
//     name: "Register User form",
//     path: "/user-register",
//      role: ["admin" , "department_head" ,"manager" , "hr" , "executive"] ,
//   },

//   {
//     icon: <RiUserSharedFill  />,
//     name: "Prefrence",
//      subItems: [
//       { name: "Farmers", path: "/blank", role: ["admin", "department_head" ,"manager" , "hr","employee" , "executive"] },
//       { name: "Procurement", path: "/blank", role: ["admin" , "department_head" ,"manager" , "hr" , "executive" , "employee"] },
//       { name: "Inventory", path: "/blank", role: ["admin" , "department_head" ,"manager" , "hr" , "executive" , "employee"] },
//       { name: "Accounts", path: "/blank", role: ["admin" , "department_head" ,"manager" , "hr" , "executive" , "employee"] },
//       { name: "Sales", path: "/blank", role: ["admin" , "department_head" ,"manager" , "hr" , "executive" , "employee"] },
//      ],
//   },

// {
  
//     icon: <FaTasks />,
//     name: "Task Manager",
//     path: "/admin-task-manager",
//   role: ["admin" , "department_head" ,"manager" , "hr" , "executive"] ,
//   },
//    {
//     icon: <PiUsersThreeBold  />,
//     name: "All Users",
//     path: "/all-users",
//   role: ["admin" , "department_head" ,"manager" , "hr" , "executive"] ,
//   },
//   {
//     icon: <CalenderIcon />,
//     name: "Task-Calendar",
//     path: "/task-calendar",
//     role: ["employee"],
//   },
//    {
//     icon: <CalenderIcon />,
//     name: "My Tasks",
//     path: "/task-show-page",
//     role: ["employee"],
//   },
//   // {
//   //   icon: <CalenderIcon />,
//   //   name: "Employee Tracker",
//   //   path: "/live-tracking",
//   //    role: ["admin" , "department_head" ,"manager" , "hr"] 
   
//   // },
//   {
//     icon: <CalenderIcon />,
//     name: "Announcement",
//     path: "/announcement",
//      role: ["admin" ,  "hr"] 
   
//   },
   
//   // {
//   //   name: "Pages",
//   //   icon: <PageIcon />,
//   //   subItems: [
//   //     { name: "Blank Page", path: "/blank", role: ["admin", "employee"] },
//   //     { name: "404 Error", path: "/error-404", role: ["admin", "employee"] },
//   //   ],
//   // },
// ];



const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();

  const [openSubmenu, setOpenSubmenu] = useState<{ type: "main" | "others"; index: number } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback((path: string) => location.pathname === path, [location.pathname]);
  const userRole = localStorage.getItem("userRole" );
  const { t } = useTranslation();

  const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: t("menu.dashboard"),
    subItems: [
      { name: t("menu.dashboard"), path: "/home", role: ["admin","department_head","manager","hr"] },
      { name: t("menu.employeeDashboard"), path: "/employee-dashboard", role: ["employee"] }
    ],
  },
  {
    icon: <CalenderIcon />,
    name: t("menu.calendar"),
    path: "/calendar",
    role: ["admin","department_head","manager","hr"],
  },
  {
    icon: <UserCircleIcon />,
    name: t("menu.profile"),
    path: "/profile",
    role: ["admin","employee","department_head","manager","hr"],
  },
  {
    icon: <ChatIcon />,
    name: t("menu.chat"),
    path: "/chat",
    role: ["admin","employee","department_head","manager","hr"],
  },
  {
    icon: <ListIcon />,
    name: t("menu.attendance"),
    subItems: [
      { name: t("menu.attendanceStart"), path: "/attandanceStart-page", role: ["employee"] },
      { name: t("menu.attendanceEnd"), path: "/attandanceEnd-page", role: ["employee"] },
    ],
  },
  {
    icon: <TbTableShare />,
    name: t("menu.forms"),
    subItems: [
      { name: t("menu.assignTaskForm"), path: "/assign-task-page", role: ["admin","department_head","manager","hr"] },
    ],
  },
  {
    icon: <MdListAlt />,
    name: t("menu.attendanceList"),
    path: "/attandance-start-admin",
    role: ["admin","department_head","manager","hr","executive"],
  },
  {
    icon: <MdAppRegistration />,
    name: t("menu.registerUserForm"),
    path: "/user-register",
    role: ["admin","department_head","manager","hr","executive"],
  },
  {
    icon: <RiUserSharedFill />,
    name: t("menu.preference"),
    subItems: [
      { name: t("menu.farmers"), path: "/blank", role: ["admin","department_head","manager","hr","employee","executive"] },
      { name: t("menu.procurement"), path: "/blank", role: ["admin","department_head","manager","hr","executive","employee"] },
      { name: t("menu.inventory"), path: "/blank", role: ["admin","department_head","manager","hr","executive","employee"] },
      { name: t("menu.accounts"), path: "/blank", role: ["admin","department_head","manager","hr","executive","employee"] },
      { name: t("menu.sales"), path: "/blank", role: ["admin","department_head","manager","hr","executive","employee"] }
    ],
  },
  {
    icon: <FaTasks />,
    name: t("menu.taskManager"),
    path: "/admin-task-manager",
    role: ["admin","department_head","manager","hr","executive"],
  },
  {
    icon: <PiUsersThreeBold />,
    name: t("menu.allUsers"),
    path: "/all-users",
    role: ["admin","department_head","manager","hr","executive"],
  },
  {
    icon: <CalenderIcon />,
    name: t("menu.taskCalendar"),
    path: "/task-calendar",
    role: ["employee"],
  },
  {
    icon: <CalenderIcon />,
    name: t("menu.myTasks"),
    path: "/task-show-page",
    role: ["employee"],
  },
  {
    icon: <CalenderIcon />,
    name: t("menu.announcement"),
    path: "/announcement",
    role: ["admin","hr"],
  },
];


const othersItems: NavItem[] = [

  {
    icon: <PlugInIcon />,
    name: t("menu.Authentication"),
    subItems: [
      { name: t("menu.signIn"), path: "/signin",  },
      // { name: "Sign Up", path: "/signup",  },
      { name: t("menu.logout"), path: "/logout",  },
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
      prev?.type === menuType && prev.index === index ? null : { type: menuType, index }
    );
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-4">
      {items
        .filter(nav => !nav.role || nav.role.includes(userRole!)) // Main item role check
        .map((nav, index) => {
          const visibleSubItems = nav.subItems?.filter(
            sub => !sub.role || sub.role.includes(userRole!)
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
    className={`fixed top-0 left-0 bg-dashboard-brown-200 dark:bg-gray-900 border-r border-gray-200 dark:text-blue-light-25 dark:border-gray-800 h-screen z-50 transition-all duration-300
    ${isExpanded || isMobileOpen || isHovered ? "w-[290px]" : "w-[90px]"}
    ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
    onMouseEnter={() => !isExpanded && setIsHovered(true)}
    onMouseLeave={() => setIsHovered(false)}
  >
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"} px-5`}>
        {/* <Link to="/"> */}
          <img src="/images/logo/cowberry-logo.svg" alt="Logo" width={170} height={0} />
        {/* </Link> */}
      </div>

      {/* Scrollable Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5">
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
    </div>
  </aside>
);


};

export default AppSidebar;