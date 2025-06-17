"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GraduationCap, Search, ChevronDown, Rocket, Star, Award } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Course {
  id: string;
  title: string;
  published: boolean;
  description?: string;
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
  rating?: number;
}

export default function Header() {
  const { data: session, status } = useSession();
  const [publishedCourses, setPublishedCourses] = useState<Course[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCoursesHovered, setIsCoursesHovered] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchPublishedCourses = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/courses/published"); // Adjusted to fetch only published courses
        if (!response.ok) {
          throw new Error("Failed to fetch courses");
        }
        const data = await response.json();
        const filteredCourses = data.courses
          .filter((course: Course) => course.published === true)
          .map((course: Course) => ({
            ...course,
            description: course.description || "Explore this exciting course to enhance your skills",
            level: course.level || ['Beginner', 'Intermediate', 'Advanced'][Math.floor(Math.random() * 3)],
            rating: course.rating || (Math.random() * 2 + 3).toFixed(1)
          }));
        setPublishedCourses(filteredCourses);
      } catch (error) {
        console.error("Error fetching published courses:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublishedCourses();
  }, []);

  // Add a function to check if the user is logged in
  const isUserLoggedIn = () => {
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    const sessionExists = !!sessionStorage.getItem("session") || !!localStorage.getItem("session");
    return !!token || sessionExists;
  };

  // Update the useEffect to suppress token-related errors if the user is not logged in
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (token) {
      console.log("Token found in session storage:", token);
    } else if (isUserLoggedIn()) {
      console.error("Token not found in session storage");
    }
  }, []);

  useEffect(() => {
    // Clear token from storage on logout
    const handleLogout = () => {
      sessionStorage.removeItem("token");
      localStorage.removeItem("token");
    };

    window.addEventListener("logout", handleLogout);
    return () => window.removeEventListener("logout", handleLogout);
  }, []);

  const handleSignOut = async () => {
    try {
      const response = await fetch("/auth/logout", {
        method: "POST",
      });
      if (response.ok) {
        sessionStorage.removeItem("token");
        localStorage.removeItem("token");
        signOut({ callbackUrl: "/" });
      } else {
        console.error("Failed to log out");
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b transition-all duration-300 ${
        isScrolled
          ? "bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/90"
          : "bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70"
      }`}
    >
      <div className="container flex h-16 items-center justify-between px-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center space-x-4"
        >
          <Link
            href="/"
            className="flex items-center space-x-2 group transition-all"
          >
            <motion.div
              whileHover={{ rotate: 12, scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <GraduationCap className="h-6 w-6 text-primary" />
            </motion.div>
            <span className="font-bold text-lg bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              LearnHub
            </span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            {["Features", "Pricing", "About Us"].map((item) => (
              <Link
                key={item}
                href={`/${item.toLowerCase().replace(/ /g, "-")}`}
                className="relative transition-colors hover:text-primary after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-primary after:transition-all hover:after:w-full"
              >
                {item}
              </Link>
            ))}
            
            {/* Courses Link with Hover Card */}
            <div 
              className="relative"
              onMouseEnter={() => setIsCoursesHovered(true)}
              onMouseLeave={() => setIsCoursesHovered(false)}
            >
              <Link
                href="/courses"
                className="flex items-center gap-1 relative transition-colors hover:text-primary after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-primary after:transition-all hover:after:w-full"
              >
                <span>Courses</span>
                <motion.span
                  animate={{ rotate: isCoursesHovered ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-4 w-4" />
                </motion.span>
              </Link>

              <AnimatePresence>
                {isCoursesHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 mt-2 w-[480px] z-50"
                  >
                    <div className="bg-background border rounded-xl shadow-xl overflow-hidden p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                          <Rocket className="h-5 w-5 text-primary" />
                          Featured Courses
                        </h3>
                        <Link 
                          href="/courses" 
                          className="text-sm text-primary hover:underline"
                        >
                          View all courses →
                        </Link>
                      </div>
                      
                      {isLoading ? (
                        <div className="grid grid-cols-2 gap-4">
                          {[...Array(4)].map((_, i) => (
                            <Skeleton key={i} className="h-32 rounded-lg" />
                          ))}
                        </div>
                      ) : publishedCourses.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4">
                          {publishedCourses.slice(0, 4).map((course) => (
                            <Link 
                              key={course.id} 
                              href={`/courses/${course.id}`}
                              className="group"
                            >
                              <Card className="h-full transition-all hover:border-primary hover:shadow-md group-hover:-translate-y-1">
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-base line-clamp-2">
                                    {course.title}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                      course.level === 'Beginner' 
                                        ? 'bg-green-100 text-green-800' 
                                        : course.level === 'Intermediate' 
                                          ? 'bg-blue-100 text-blue-800' 
                                          : 'bg-purple-100 text-purple-800'
                                    }`}>
                                      {course.level}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                      <span>{course.rating}</span>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-muted-foreground">
                          No courses available yet
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link
              href="/contact"
              className="relative transition-colors hover:text-primary after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-primary after:transition-all hover:after:w-full"
            >
              Contact
            </Link>
          </nav>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center space-x-3"
        >
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              className="w-64 pl-10 pr-4 py-2 rounded-full focus-visible:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <ThemeToggle />

          {status === "loading" ? (
            <div className="flex items-center space-x-2">
              <Skeleton className="h-9 w-20 rounded-md" />
              <Skeleton className="h-9 w-24 rounded-md" />
            </div>
          ) : !session ? (
            <div className="flex items-center space-x-2">
              <Link href="/auth/signin">
                <Button
                  variant="outline"
                  className="hover:bg-primary/10 hover:text-primary"
                >
                  Login
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white shadow-md hover:shadow-lg transition-all">
                  Get Started
                </Button>
              </Link>
            </div>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-2 focus:outline-none group">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-primary to-primary/70 flex items-center justify-center text-white font-bold group-hover:shadow-md transition-all">
                    {session.user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden md:inline text-sm font-medium">
                    {session.user?.name?.split(" ")[0]}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 mt-2 rounded-lg shadow-lg border p-2"
              >
                <div className="px-2 py-1.5 text-sm font-medium">
                  {session.user.name}
                </div>
                <div className="px-2 pb-2 text-xs text-muted-foreground">
                  {session.user.email}
                </div>
                <DropdownMenuItem asChild>
                  <Link
                    href={`/dashboard/${session.user?.role?.toLowerCase()}`}
                    className="w-full px-2 py-1.5 rounded-md hover:bg-accent transition-colors cursor-pointer"
                  >
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="px-2 py-1.5 rounded-md hover:bg-accent transition-colors cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </motion.div>
      </div>
    </header>
  );
}