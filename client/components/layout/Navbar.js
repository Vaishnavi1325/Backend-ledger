"use client";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Landmark, LogOut, User as UserIcon, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { ProfileModal } from "@/components/profile/ProfileModal";

export function Navbar({ onOpenTransfer }) {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [profileOpen, setProfileOpen] = useState(false);

    async function handleLogout() {
        await logout();
        router.push("/login");
    }

    return (<header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-md supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
            <Landmark className="h-5 w-5"/>
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-foreground">
              LedgerBank
            </h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
              Double-Entry Platform
            </p>
          </div>
        </div>

        {/* User Profile & Actions */}
        <div className="flex items-center gap-2.5">
          {user && (
            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-muted/60 hover:bg-muted/90 px-3 py-1.5 text-xs text-muted-foreground transition-colors cursor-pointer border border-transparent hover:border-input"
              title="Click to view profile & change password"
            >
              <UserIcon className="h-3.5 w-3.5 text-foreground"/>
              <span className="font-medium text-foreground">{user.name}</span>
              <span className="hidden md:inline text-muted-foreground">({user.role || "customer"})</span>
            </button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setProfileOpen(true)}
            className="text-xs gap-1.5 h-8 sm:hidden"
            title="Profile & Security Settings"
          >
            <Settings className="h-3.5 w-3.5"/>
          </Button>

          <Button variant="outline" size="sm" onClick={handleLogout} className="text-xs gap-1.5 h-8" title="Sign out of your account">
            <LogOut className="h-3.5 w-3.5"/>
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </div>

      <ProfileModal open={profileOpen} onOpenChange={setProfileOpen} />
    </header>);
}
