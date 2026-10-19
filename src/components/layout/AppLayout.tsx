import React from "react";
import { Outlet } from "react-router-dom";
import styles from "./AppLayout.module.css";
import { Navbar } from "./Navbar/Navbar";
import { Sidebar } from "./Sidebar/Sidebar";
import { BottomNav } from "./BottomNav/BottomNav";
import { BroadcastBanner } from "./BroadcastBanner/BroadcastBanner";
import { AuthModal } from "../../features/auth/AuthModal";
import { OnboardingModal } from "../../features/profile/OnboardingModal";
import { ToastContainer } from "../ui/Toast/ToastContainer";
import { ApiEndpointSetupModal } from "./ApiEndpointSetupModal/ApiEndpointSetupModal";
import { useAuthStore } from "../../store/authStore";
import { useApiEndpointStore } from "../../store/apiEndpointStore";

export const AppLayout: React.FC = () => {
  const { user, isAuthenticated, isAuthModalOpen, openAuthModal, closeAuthModal } = useAuthStore();
  const { checkInitialSetup } = useApiEndpointStore();

  React.useEffect(() => {
    checkInitialSetup();
  }, [checkInitialSetup]);

  const showOnboarding = Boolean(isAuthenticated && user && !user.onboardingConcluido);

  return (
    <div className={styles.layout}>
      <BroadcastBanner />
      <Navbar onOpenAuthModal={openAuthModal} />
      <div className={styles.bodyWrapper}>
        <Sidebar />
        <main className={styles.mainContent}>
          <Outlet />
        </main>
      </div>
      <BottomNav />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
      />
      <OnboardingModal isOpen={showOnboarding} />
      <ApiEndpointSetupModal />
      <ToastContainer />
    </div>
  );
};
