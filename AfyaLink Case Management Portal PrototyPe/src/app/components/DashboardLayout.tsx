import { ReactNode, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Heart,
  LayoutDashboard,
  Users,
  FileText,
  Calendar,
  FolderOpen,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  UserCircle,
  Shield,
  Briefcase,
  Search,
  MessageSquare,
  MapPin,
  Clock,
  Cog,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useAuth, UserRole } from "../context/AuthContext";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";

interface MenuItem {
  icon: any;
  label: string;
  path: string;
  roles?: UserRole[];
}

const menuItems: MenuItem[] = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    path: "dashboard",
  },
  {
    icon: Users,
    label: "Beneficiaries",
    path: "beneficiaries",
  },
  { icon: FileText, label: "Cases", path: "cases" },
  {
    icon: Calendar,
    label: "Interventions",
    path: "interventions",
  },
  {
    icon: MapPin,
    label: "Field Work",
    path: "field-work",
    roles: ["social_worker"],
  },
  {
    icon: Clock,
    label: "Schedule",
    path: "schedule",
    roles: ["social_worker"],
  },
  {
    icon: FileText,
    label: "Case Monitor",
    path: "case-monitor",
    roles: ["supervisor"],
  },
  { icon: FolderOpen, label: "Documents", path: "documents" },
  { icon: BarChart3, label: "Reports", path: "reports" },
  { icon: Bell, label: "Notifications", path: "notifications" },
  {
    icon: MessageSquare,
    label: "Messages",
    path: "collaboration",
  },
  {
    icon: Shield,
    label: "User Management",
    path: "users",
    roles: ["admin"],
  },
  {
    icon: Cog,
    label: "System Config",
    path: "system-config",
    roles: ["admin"],
  },
  { icon: Settings, label: "Settings", path: "settings" },
];

interface DashboardLayoutProps {
  children: ReactNode;
  role: UserRole;
}

export function DashboardLayout({
  children,
  role,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "admin":
        return Shield;
      case "supervisor":
        return Briefcase;
      case "social_worker":
        return UserCircle;
      default:
        return UserCircle;
    }
  };

  const RoleIcon = getRoleIcon(role);

  const getRoleName = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "Administrator";
      case "supervisor":
        return "Supervisor";
      case "social_worker":
        return "Social Worker";
      default:
        return "User";
    }
  };

  const filteredMenuItems = menuItems.filter(
    (item) =>
      !item.roles || (role && item.roles.includes(role)),
  );

  const isActive = (path: string) => {
    const basePath = `/${role?.replace("_", "-")}/${path}`;
    return location.pathname === basePath;
  };

  // Get breadcrumb path
  const getBreadcrumbs = () => {
    const pathParts = location.pathname
      .split("/")
      .filter(Boolean);
    const breadcrumbs = [
      {
        label: "Dashboard",
        path: `/${role?.replace("_", "-")}/dashboard`,
      },
    ];

    if (pathParts.length > 2) {
      const currentPage = pathParts[2];
      const pageLabel =
        menuItems.find((item) => item.path === currentPage)
          ?.label || currentPage;
      breadcrumbs.push({
        label: pageLabel,
        path: location.pathname,
      });
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-primary fill-primary" />
          <span className="font-bold text-primary">
            AfyaLink
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-white border-r flex flex-col z-40 transition-transform duration-300
          lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b">
          <Link to="/" className="flex items-center gap-2">
            <Heart className="h-7 w-7 text-primary fill-primary" />
            <span className="text-xl font-bold text-primary">
              AfyaLink
            </span>
          </Link>
        </div>

        {/* User Info */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {user?.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.name}
              </p>
              <Badge
                variant="secondary"
                className="text-xs mt-1"
              >
                <RoleIcon className="h-3 w-3 mr-1" />
                {getRoleName(role)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              const showUnreadBadge =
                item.path === "collaboration";

              return (
                <li key={item.path}>
                  <Link
                    to={`/${role?.replace("_", "-")}/${item.path}`}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                      ${
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-gray-700 hover:bg-gray-100"
                      }
                    `}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-medium flex-1">
                      {item.label}
                    </span>
                    {showUnreadBadge && (
                      <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-white text-[10px]">
                        3
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-64 pt-16 lg:pt-0 min-h-screen">
        {/* Top Bar with Search and Breadcrumbs */}
        <div className="sticky top-16 lg:top-0 z-30 bg-white border-b px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Breadcrumbs */}
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((crumb, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1.5"
                  >
                    {index > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem>
                      {index === breadcrumbs.length - 1 ? (
                        <BreadcrumbPage>
                          {crumb.label}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link to={crumb.path}>
                            {crumb.label}
                          </Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </div>
                ))}
              </BreadcrumbList>
            </Breadcrumb>

            {/* Global Search */}
            <div className="relative w-full sm:w-auto sm:min-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search beneficiaries, cases, documents..."
                className="pl-9 bg-gray-50 border-gray-200"
              />
            </div>
          </div>
        </div>

        <div className="p-6 lg:p-8">{children}</div>
      </main>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}