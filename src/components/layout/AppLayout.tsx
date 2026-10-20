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
import { QuickSearchModal } from "./QuickSearchModal/QuickSearchModal";
import { useAuthStore } from "../../store/authStore";
import { useApiEndpointStore } from "../../store/apiEndpointStore";

export const AppLayout: React.FC = () => {
  const { user, isAuthenticated, isAuthModalOpen, openAuthModal, closeAuthModal } = useAuthStore();
  const { checkInitialSetup } = useApiEndpointStore();
  const [isQuickSearchOpen, setIsQuickSearchOpen] = React.useState(false);

  React.useEffect(() => {
    checkInitialSetup();
  }, [checkInitialSetup]);

  // Listener global de atalho Ctrl+K / Cmd+K
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsQuickSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const showOnboarding = Boolean(isAuthenticated && user && !user.onboardingConcluido);

  return (
    <div className={styles.layout}>
      <BroadcastBanner />
      <Navbar onOpenAuthModal={openAuthModal} onOpenQuickSearch={() => setIsQuickSearchOpen(true)} />
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
      <QuickSearchModal isOpen={isQuickSearchOpen} onClose={() => setIsQuickSearchOpen(false)} />
      <ToastContainer />
    </div>
  );
};
