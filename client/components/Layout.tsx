import { Link, NavLink } from "react-router-dom";
import React from "react";
import Logo from "@/components/Logo";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen text-white bg-background">
      <header className="sticky top-0 z-30 border-b border-white/10 backdrop-blur bg-black/30">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-extrabold tracking-tight">
            <Logo />
            <span className="text-xl">LunaSpin</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <NavLink to="/" className={({isActive})=> isActive? "text-primary" : "text-white/80 hover:text-white"}>Home</NavLink>
            <NavLink to="/history" className={({isActive})=> isActive? "text-primary" : "text-white/80 hover:text-white"}>History</NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 space-y-8">{children}</main>
      <footer className="mx-auto max-w-6xl px-4 py-10 text-center text-white/50 text-sm">
        
      </footer>
    </div>
  );
}
