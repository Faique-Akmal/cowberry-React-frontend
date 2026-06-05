import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import {
  MdOutlineHome,
  MdOutlinePeople,
  MdOutlineAdd,
  MdAnnouncement,
} from "react-icons/md";
import { FaCalendarAlt } from "react-icons/fa";
import { MdListAlt } from "react-icons/md";
import { UserCircleIcon } from "../icons";
import { IoPersonAddOutline } from "react-icons/io5";
import { GridIcon, PlugInIcon } from "../icons";
import { PiUsersThreeBold } from "react-icons/pi";

// ── Role helpers (mirrors AppSidebar logic exactly) ──────────────────────────
function normalizeRole(role: string | null): string | null {
  return role ? role.toLowerCase().trim() : null;
}

function hasAccess(
  itemRoles: string[] | undefined,
  userRole: string | null,
): boolean {
  if (!itemRoles || itemRoles.length === 0) return true;
  if (!userRole) return false;
  return itemRoles.map((r) => r.toLowerCase().trim()).includes(userRole);
}

// ── Types ────────────────────────────────────────────────────────────────────
type SubItem = {
  label: string;
  path: string;
  icon: React.ReactNode;
  role?: string[];
};

type ArcItem = {
  icon: React.ReactNode;
  label: string;
  path?: string;
  role?: string[];
  subItems?: SubItem[];
};

// ── Nav config (role arrays mirror AppSidebar navItems exactly) ───────────────
const buildArcItems = (): ArcItem[] => [
  {
    icon: <UserCircleIcon className="w-5 h-5" />,
    label: "Check-in",
    path: "/employeecheckin",
    role: ["admin", "manager", "hr", "zonalmanager", "headofdepartment"],
  },
  {
    icon: <MdListAlt className="text-xl" />,
    label: "Travel",
    path: "/tracking-admin",
    role: ["admin", "zonalmanager", "manager", "hr", "headofdepartment"],
  },
  {
    icon: <FaCalendarAlt className="text-xl" />,
    label: "Leaves",
    // no top-level role — visible if ANY sub-item is visible
    subItems: [
      {
        label: "All Leaves",
        path: "/get-leaves",
        icon: <MdListAlt className="text-base" />,
        role: ["admin", "hr"],
      },
      {
        label: "Reportee",
        path: "/leave-management-reportee",
        icon: <MdListAlt className="text-base" />,
        role: ["manager", "zonalmanager", "headofdepartment"],
      },
      {
        label: "Self",
        path: "/getself-leaves",
        icon: <UserCircleIcon className="w-4 h-4" />,
        role: ["admin", "manager", "hr", "zonalmanager", "headofdepartment"],
      },
      {
        label: "Apply",
        path: "/apply-leaves",
        icon: <MdOutlineAdd className="text-base" />,
        role: ["admin", "manager", "hr", "zonalmanager", "headofdepartment"],
      },
    ],
  },
  {
    icon: <MdOutlineAdd className="text-xl" />,
    label: "Add",
    subItems: [
      {
        label: "Zone",
        path: "/add-zones",
        icon: <MdOutlineAdd className="text-base" />,
        role: ["admin", "hr"],
      },
      {
        label: "Dept",
        path: "/add-department",
        icon: <MdAnnouncement className="text-base" />,
        role: ["admin", "hr"],
      },
      {
        label: "Role",
        path: "/add-role",
        icon: <MdListAlt className="text-base" />,
        role: ["admin", "hr"],
      },
    ],
  },
  {
    icon: <MdAnnouncement className="text-xl" />,
    label: "Announce",
    path: "/announcementList",
    role: ["admin", "manager", "hr", "zonalmanager", "headofdepartment"],
  },
];

// ── Arc math ─────────────────────────────────────────────────────────────────
const MAIN_RADIUS = 130;

function getArcPos(angleDeg: number, radius: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: -Math.cos(rad) * radius, y: Math.sin(rad) * radius };
}

// Evenly spread N items across 160°→20°
function spreadAngles(count: number): number[] {
  if (count === 1) return [90];
  return Array.from({ length: count }, (_, i) => 160 - (140 / (count - 1)) * i);
}

// Sub-arc: fan above parent, spread ±50° around 90°
function subArcAngles(count: number): number[] {
  if (count === 1) return [90];
  const spread = count === 2 ? 50 : count === 3 ? 60 : 80;
  const start = 90 - (spread * (count - 1)) / 2;
  return Array.from({ length: count }, (_, i) => start + i * spread);
}

const SUB_RADIUS = 76;

// ── Component ─────────────────────────────────────────────────────────────────
export default function MobileBottomNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [openSubMenu, setOpenSubMenu] = useState<number | null>(null);
  const location = useLocation();

  const userRole = normalizeRole(localStorage.getItem("userRole"));

  useEffect(() => {
    setIsOpen(false);
    setOpenSubMenu(null);
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;
  const isParentActive = (item: ArcItem) =>
    item.subItems?.some((s) => isActive(s.path)) ?? false;

  // Filter arc items by role, and filter each item's subItems by role
  const visibleArcItems = buildArcItems()
    .map((item) => ({
      ...item,
      subItems: item.subItems?.filter((s) => hasAccess(s.role, userRole)),
    }))
    .filter((item) => {
      // Items with subItems: visible if at least one sub is visible
      if (item.subItems !== undefined) return item.subItems.length > 0;
      // Items with path: check role
      return hasAccess(item.role, userRole);
    });

  const mainAngles = spreadAngles(visibleArcItems.length);

  const closeAll = () => {
    setIsOpen(false);
    setOpenSubMenu(null);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40"
          style={{ background: "rgba(0,0,0,0.25)" }}
          onClick={closeAll}
        />
      )}

      {/* Semicircle shell */}
      <div
        className="lg:hidden fixed pointer-events-none"
        style={{
          bottom: 64,
          left: "50%",
          transform: "translateX(-50%)",
          width: 320,
          height: 180,
          borderRadius: "160px 160px 0 0",
          background: "white",
          border: "0.5px solid #e2e8f0",
          zIndex: 41,
          transformOrigin: "bottom center",
          transition: "opacity 0.25s, scale 0.25s",
          opacity: isOpen ? 1 : 0,
          scale: isOpen ? "1" : "0.5",
        }}
      />

      {/* Arc items */}
      {visibleArcItems.map((item, i) => {
        const { x, y } = getArcPos(mainAngles[i], MAIN_RADIUS);
        const active = item.path ? isActive(item.path) : isParentActive(item);
        const subOpen = openSubMenu === i;
        const sAngles = item.subItems ? subArcAngles(item.subItems.length) : [];

        const iconCenterBottom = 64 + y - 22;
        const iconCenterLeft = `calc(50% + ${x}px - 22px)`;

        return (
          <div key={i}>
            {/* Sub-arc items */}
            {item.subItems?.map((sub, si) => {
              const sv = getArcPos(sAngles[si], SUB_RADIUS);
              const subActive = isActive(sub.path);

              return (
                <div
                  key={sub.path}
                  className="lg:hidden fixed"
                  style={{
                    bottom: iconCenterBottom + 22 + sv.y - 18,
                    left: `calc(50% + ${x + sv.x}px - 18px)`,
                    zIndex: 55,
                    transition: "opacity 0.18s, transform 0.18s",
                    transitionDelay: subOpen ? `${si * 35}ms` : "0ms",
                    opacity: isOpen && subOpen ? 1 : 0,
                    transform: isOpen && subOpen ? "scale(1)" : "scale(0.3)",
                    pointerEvents: isOpen && subOpen ? "auto" : "none",
                  }}
                >
                  <Link
                    to={sub.path}
                    onClick={closeAll}
                    className="flex flex-col items-center gap-0.5"
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors
                        ${
                          subActive
                            ? "bg-lantern-blue-600 border-lantern-blue-600"
                            : "bg-white dark:bg-gray-800 border-lantern-blue-300 dark:border-blue-700"
                        }`}
                    >
                      <span
                        className={
                          subActive
                            ? "[&_*]:text-white [&_*]:fill-white"
                            : "[&_*]:text-lantern-blue-600"
                        }
                      >
                        {sub.icon}
                      </span>
                    </div>
                    <span className="text-[8px] font-medium text-lantern-blue-600 dark:text-blue-300 whitespace-nowrap">
                      {sub.label}
                    </span>
                  </Link>
                </div>
              );
            })}

            {/* Main arc icon */}
            <div
              className="lg:hidden fixed"
              style={{
                bottom: iconCenterBottom,
                left: iconCenterLeft,
                zIndex: 52,
                transition: "opacity 0.2s, transform 0.2s",
                transitionDelay: isOpen ? `${i * 40 + 40}ms` : "0ms",
                opacity: isOpen ? 1 : 0,
                transform: isOpen ? "scale(1)" : "scale(0.4)",
                pointerEvents: isOpen ? "auto" : "none",
              }}
            >
              {item.path ? (
                <Link
                  to={item.path}
                  onClick={closeAll}
                  className="flex flex-col items-center gap-1"
                >
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center border-2 transition-colors
                      ${
                        active
                          ? "bg-lantern-blue-600 border-lantern-blue-600"
                          : "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
                      }`}
                  >
                    <span
                      className={
                        active
                          ? "[&_*]:text-white [&_*]:fill-white"
                          : "[&_*]:text-lantern-blue-600"
                      }
                    >
                      {item.icon}
                    </span>
                  </div>
                  <span className="text-[9px] font-medium text-lantern-blue-600 dark:text-blue-300 whitespace-nowrap">
                    {item.label}
                  </span>
                </Link>
              ) : (
                <button
                  onClick={() => setOpenSubMenu(subOpen ? null : i)}
                  className="flex flex-col items-center gap-1"
                >
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center border-2 transition-colors
                      ${
                        active || subOpen
                          ? "bg-lantern-blue-600 border-lantern-blue-600"
                          : "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
                      }`}
                  >
                    <span
                      className={
                        active || subOpen
                          ? "[&_*]:text-white [&_*]:fill-white"
                          : "[&_*]:text-lantern-blue-600"
                      }
                    >
                      {item.icon}
                    </span>
                  </div>
                  <span className="text-[9px] font-medium text-lantern-blue-600 dark:text-blue-300 whitespace-nowrap">
                    {item.label}
                  </span>
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* Bottom bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 h-16 px-4">
        {/* Home — always visible */}
        <Link
          to="/home"
          className={`flex flex-col items-center gap-1 px-4 py-1 rounded-xl transition-colors
            ${isActive("/home") ? "text-lantern-blue-600" : "text-gray-500 dark:text-gray-400"}`}
        >
          <MdOutlineHome className="text-2xl" />
          <span className="text-[9px] font-medium">Home</span>
        </Link>

        {/* Center toggle */}
        <button
          onClick={() => {
            setIsOpen((p) => !p);
            setOpenSubMenu(null);
          }}
          className={`rounded-full flex items-center justify-center -mt-5 shadow-md transition-all duration-200
            ${isOpen ? "bg-lantern-blue-600 rotate-45" : "bg-lantern-blue-600 hover:bg-lantern-blue-800"}`}
          style={{ width: 52, height: 52 }}
          aria-label="Toggle menu"
        >
          <MdOutlineAdd className="text-white text-2xl" />
        </button>

        {/* All Users — role-gated */}
        {hasAccess(
          ["admin", "manager", "hr", "zonalmanager", "headofdepartment"],
          userRole,
        ) && (
          <Link
            to="/all-users"
            className={`flex flex-col items-center gap-1 px-4 py-1 rounded-xl transition-colors
              ${isActive("/all-users") ? "text-lantern-blue-600" : "text-gray-500 dark:text-gray-400"}`}
          >
            <MdOutlinePeople className="text-2xl" />
            <span className="text-[9px] font-medium">All Users</span>
          </Link>
        )}
      </div>
    </>
  );
}
