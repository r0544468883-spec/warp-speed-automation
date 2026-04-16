import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, BookOpen, Video, Calculator, Settings, Zap, Download, History,
  ChevronLeft, ChevronRight, LogOut, Menu, X, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { path: "/", icon: Home, label: "בית" },
  { path: "/wiki", icon: BookOpen, label: "ויקיפדיה" },
  { path: "/smart-audit", icon: Video, label: "Smart Audit" },
  { path: "/roi", icon: Calculator, label: "ROI" },
  { path: "/send-history", icon: History, label: "היסטוריה" },
  { path: "/settings", icon: Settings, label: "הגדרות" },
  { path: "/extension", icon: Download, label: "תוסף" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { profile, signOut } = useAuth();

  return (
    <div className="flex min-h-screen bg-background" dir="rtl">
      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-card/80 backdrop-blur-xl border-b border-border md:hidden">
        <div className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-primary" />
          <span className="font-heading font-bold text-lg text-gradient">24.7</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={`fixed top-0 right-0 z-40 h-full bg-card/50 backdrop-blur-xl border-l border-border flex flex-col transition-all
          ${mobileOpen ? "translate-x-0" : "translate-x-full"} md:translate-x-0 md:static`}
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ duration: 0.2 }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 p-4 border-b border-border h-16">
          <div className="relative">
            <Zap className="h-8 w-8 text-primary" />
            <div className="absolute inset-0 blur-lg bg-primary/30 rounded-full" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <span className="font-heading font-bold text-xl text-gradient">24.7</span>
                <p className="text-[10px] text-muted-foreground tracking-widest">AUTOMATION</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative
                  ${isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-l-full"
                  />
                )}
                <item.icon className="h-5 w-5 shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm font-medium">
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div className="p-3 border-t border-border space-y-2">
          {profile && !collapsed && (
            <div className="flex items-center gap-2 px-3 py-2">
              <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-medium truncate">{profile.display_name || "משתמש"}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{profile.subscription_tier}</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center text-muted-foreground hover:text-destructive"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="mr-2 text-xs">התנתק</span>}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center hidden md:flex"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      </motion.aside>

      {/* Main content */}
      <main className="flex-1 min-h-screen md:pt-0 pt-16">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-6 md:p-8 max-w-7xl mx-auto"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
