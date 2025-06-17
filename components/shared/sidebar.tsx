"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ROUTES } from "@/lib/constants";
import {
  BarChart,
  BookOpen,
  FileText,
  Home,
  LayoutDashboard,
  MenuIcon,
  MessageSquare,
  School,
  Settings,
  Users,
  Award,
} from "lucide-react";

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
}

const NavItem = ({ href, label, icon, active }: NavItemProps) => (
  <Link
    href={href}
    className={cn(
      "flex items-center gap-x-2 text-sm font-medium transition-all rounded-md p-2",
      active
        ? "text-primary bg-primary/10 hover:bg-primary/20"
        : "text-muted-foreground hover:text-primary hover:bg-primary/10"
    )}
  >
    {icon}
    {label}
  </Link>
);

export function Sidebar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Show a loading state only if the session is being fetched for the first time
  const isLoading = status === "loading";

  if (isLoading && !session) {
    return (
      <div className="hidden md:flex h-screen flex-col w-64 border-r bg-background">
        <div className="flex h-14 items-center px-4 border-b">
          <span className="font-semibold">Loading...</span>
        </div>
      </div>
    );
  }

  // If no session/user, render minimal sidebar with login link
  if (!session || !session.user) {
    return (
      <div className="hidden md:flex h-screen flex-col w-64 border-r bg-background">
        <div className="flex h-14 items-center px-4 border-b">
          <Link href="/" className="flex items-center gap-x-2">
            <School className="h-6 w-6" />
            <span className="font-semibold">Learning Platform</span>
          </Link>
        </div>
        <div className="flex-1 flex flex-col justify-center items-center p-4">
          <p className="text-muted-foreground text-sm text-center mb-4">
            Please sign in to access your account
          </p>
          <Button asChild>
            <Link href={ROUTES.SIGN_IN}>Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  // User is authenticated, determine which navigation items to show based on role
  const userRole = session.user.role as string;

  let navItems: { href: string; label: string; icon: React.ReactNode }[] = [];

  // Admin navigation
  if (userRole === "ADMIN") {
    navItems = [
      {
        href: ROUTES.ADMIN.DASHBOARD,
        label: "Dashboard",
        icon: <LayoutDashboard className="h-4 w-4" />,
      },
      {
        href: ROUTES.ADMIN.USERS,
        label: "Users",
        icon: <Users className="h-4 w-4" />,
      },
      {
        href: ROUTES.ADMIN.COURSES,
        label: "Courses",
        icon: <BookOpen className="h-4 w-4" />,
      },
      {
        href: ROUTES.ADMIN.FORUMS,
        label: "Forums",
        icon: <MessageSquare className="h-4 w-4" />,
      },
      {
        href: ROUTES.ADMIN.CERTIFICATES,
        label: "Certificates",
        icon: <Award className="h-4 w-4" />,
      },
      {
        href: ROUTES.ADMIN.SETTINGS,
        label: "Settings",
        icon: <Settings className="h-4 w-4" />,
      },
    ];
  }
  // Instructor navigation
  else if (userRole === "INSTRUCTOR") {
    navItems = [
      {
        href: ROUTES.INSTRUCTOR.DASHBOARD,
        label: "Dashboard",
        icon: <LayoutDashboard className="h-4 w-4" />,
      },
      {
        href: ROUTES.INSTRUCTOR.COURSES,
        label: "My Courses",
        icon: <BookOpen className="h-4 w-4" />,
      },
      {
        href: ROUTES.INSTRUCTOR.ASSIGNMENTS,
        label: "Assignments",
        icon: <FileText className="h-4 w-4" />,
      },
      {
        href: ROUTES.INSTRUCTOR.STUDENTS,
        label: "Students",
        icon: <Users className="h-4 w-4" />,
      },
      {
        href: ROUTES.INSTRUCTOR.FORUMS,
        label: "Forums",
        icon: <MessageSquare className="h-4 w-4" />,
      },
    ];
  }
  // Student navigation
  else {
    navItems = [
      {
        href: ROUTES.STUDENT.DASHBOARD,
        label: "Dashboard",
        icon: <LayoutDashboard className="h-4 w-4" />,
      },
      {
        href: ROUTES.STUDENT.COURSES,
        label: "My Courses",
        icon: <BookOpen className="h-4 w-4" />,
      },
      {
        href: ROUTES.STUDENT.ASSIGNMENTS,
        label: "Assignments",
        icon: <FileText className="h-4 w-4" />,
      },
      {
        href: ROUTES.STUDENT.CERTIFICATES,
        label: "Certificates",
        icon: <Award className="h-4 w-4" />,
      },
      {
        href: ROUTES.STUDENT.FORUMS,
        label: "Forums",
        icon: <MessageSquare className="h-4 w-4" />,
      },
    ];
  }

  // Common routes for all authenticated users
  const commonRoutes = [
    {
      href: ROUTES.COURSES.INDEX,
      label: "Browse Courses",
      icon: <BookOpen className="h-4 w-4" />,
    },
    {
      href: ROUTES.FORUMS.INDEX,
      label: "Discussion Forums",
      icon: <MessageSquare className="h-4 w-4" />,
    },
  ];

  // Ensure the "Dashboard" option is highlighted when the dashboard is launched after login
  const isActive = (href: string) =>
    pathname === href ||
    (pathname === "/instructor/dashboard" && href === ROUTES.INSTRUCTOR.DASHBOARD);

  // Desktop sidebar
  const SidebarContent = (
    <>
      <div className="flex h-14 items-center px-4 border-b">
        <Link href="/" className="flex items-center gap-x-2">
          <School className="h-6 w-6" />
          <span className="font-semibold">Learning Platform</span>
        </Link>
      </div>
      <ScrollArea className="flex-1 px-4 py-6">
        <div className="space-y-1">
          <nav className="flex-1 px-2 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                  isActive(item.href)
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                {item.icon}
                <span className="ml-3">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-border my-6" />

        {/* Common routes */}
        <div className="space-y-1">
          {commonRoutes.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={pathname === item.href}
            />
          ))}
        </div>
      </ScrollArea>
    </>
  );

  // Mobile sidebar using Sheet
  const MobileSidebar = (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open Menu"
        >
          <MenuIcon className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0">
        {SidebarContent}
      </SheetContent>
    </Sheet>
  );

  return (
    <>
      <div className="hidden md:flex h-screen flex-col w-64 border-r bg-background">
        {SidebarContent}
      </div>
      {MobileSidebar}
    </>
  );
}