
"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "@/app/auth/actions";

type HubSidebarProps = {
  activePage:
    | "dashboard"
    | "subjects"
    | "documents"
    | "quiz"
    | "planner"
    | "progress";
};

export default function HubSidebar({ activePage }: HubSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: "⌂" },
    { id: "planner", label: "Study planner", href: "/dashboard#study-planner", icon: "▦" },
    { id: "subjects", label: "My subjects", href: "/subjects", icon: "▤" },
    { id: "documents", label: "Documents", href: "/documents", icon: "▱" },
    { id: "quiz", label: "Quizzes & tests", href: "/quiz", icon: "✓" },
    { id: "progress", label: "Study progress", href: "/study-progress", icon: "◷" },
  ];

  return (
    <>
      <button
        type="button"
        className="hub-mobile-menu"
        onClick={() => setIsOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={isOpen}
      >
        ☰
      </button>

      {isOpen && (
        <button
          type="button"
          className="hub-sidebar-backdrop"
          onClick={() => setIsOpen(false)}
          aria-label="Close navigation menu"
        />
      )}

      <aside className={`hub-sidebar ${isOpen ? "mobile-open" : ""}`}>
        <button
          type="button"
          className="hub-mobile-close"
          onClick={() => setIsOpen(false)}
          aria-label="Close navigation menu"
        >
          ×
        </button>

        <Link
          href="/dashboard"
          className="hub-brand"
          onClick={() => setIsOpen(false)}
        >
          <span className="hub-brand-mark">✚</span>
          <span>PharmaStudy <em>Hub</em></span>
        </Link>

        <div className="sidebar-caption">LEARNING SPACE</div>

        <nav className="hub-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <Link
              key={item.id}
              className={`hub-nav-link ${activePage === item.id ? "active" : ""}`}
              href={item.href}
              onClick={() => setIsOpen(false)}
            >
              <span>{item.icon}</span> {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <div className="tip-icon">✦</div>
            <strong>Small steps, big progress.</strong>
            <p>Consistency is one of the best tools in your study kit.</p>
          </div>

          <form action={signOut}>
            <button className="sidebar-logout" type="submit">
              ↪ Log out
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
