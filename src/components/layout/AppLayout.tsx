import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import styles from "./AppLayout.module.css";
import { Navbar } from "./Navbar/Navbar";
import { Sidebar } from "./Sidebar/Sidebar";
import { BottomNav } from "./BottomNav/BottomNav";
import { BroadcastBanner } from "./BroadcastBanner/BroadcastBanner";
import { AuthModal } from "../../features/auth/AuthModal";
import { OnboardingModal } from "../../features/profile/OnboardingModal";
import { ToastContainer } from "../ui/Toast/ToastContainer";
import { useAuthStore } from "../../store/authStore";

export const AppLayout: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const showOnboarding = Boolean(isAuthenticated && user && !user.onboardingConcluido);

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
      <OnboardingModal isOpen={showOnboarding} />
      <ToastContainer />
    </div>
  );
};
