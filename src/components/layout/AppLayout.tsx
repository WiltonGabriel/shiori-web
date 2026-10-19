import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import styles from "./AppLayout.module.css";
import { Navbar } from "./Navbar/Navbar";
import { Sidebar } from "./Sidebar/Sidebar";
import { BottomNav } from "./BottomNav/BottomNav";
import { BroadcastBanner } from "./BroadcastBanner/BroadcastBanner";
import { AuthModal } from "../../features/auth/AuthModal";
import { ToastContainer } from "../ui/Toast/ToastContainer";

export const AppLayout: React.FC = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <div className={styles.layout}>
      <BroadcastBanner />
      <Navbar onOpenAuthModal={() => setIsAuthModalOpen(true)} />
      <div className={styles.bodyWrapper}>
        <Sidebar />
        <main className={styles.mainContent}>
          <Outlet />
        </main>
      </div>
      <BottomNav />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
      <ToastContainer />
    </div>
  );
};
