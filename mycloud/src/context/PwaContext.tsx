import React, { createContext, useContext, useState, useEffect } from 'react';

interface PwaContextType {
  isStandalone: boolean;
  canInstall: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  showInstallModal: boolean;
  setShowInstallModal: (show: boolean) => void;
  showBanner: boolean;
  setShowBanner: (show: boolean) => void;
  promptInstall: () => Promise<void>;
  dismissBanner: () => void;
}

const PwaContext = createContext<PwaContextType | undefined>(undefined);

export const PwaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // 1. Detect if running in standalone mode (already installed as PWA)
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(Boolean(isStandaloneMode));
    };

    checkStandalone();
    window.matchMedia('(display-mode: standalone)').addEventListener('change', checkStandalone);

    // 2. Detect OS
    const ua = navigator.userAgent || '';
    const ios = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const android = /Android/i.test(ua);
    setIsIOS(ios);
    setIsAndroid(android);

    // 3. Listen for Chromium/Android install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissed = localStorage.getItem('mycloud_pwa_dismissed_v1');
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // 4. For iOS devices, check if not dismissed and not in standalone
    if (ios) {
      const isStandaloneMode = (window.navigator as any).standalone === true;
      const dismissed = localStorage.getItem('mycloud_pwa_dismissed_v1');
      if (!isStandaloneMode && !dismissed) {
        // Delay showing banner slightly for better UX
        const timer = setTimeout(() => {
          setShowBanner(true);
        }, 2000);
        return () => clearTimeout(timer);
      }
    }

    // 5. App installed listener
    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
      setShowBanner(false);
      setShowInstallModal(false);
      localStorage.setItem('mycloud_pwa_dismissed_v1', 'true');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setDeferredPrompt(null);
          setShowBanner(false);
        }
      } catch (err) {
        console.warn('Install prompt error:', err);
        setShowInstallModal(true);
      }
    } else {
      // For iOS or browsers without deferred prompt, open the guide modal
      setShowInstallModal(true);
    }
  };

  const dismissBanner = () => {
    setShowBanner(false);
    localStorage.setItem('mycloud_pwa_dismissed_v1', 'true');
  };

  const canInstall = !isStandalone && (Boolean(deferredPrompt) || isIOS || isAndroid);

  return (
    <PwaContext.Provider
      value={{
        isStandalone,
        canInstall,
        isIOS,
        isAndroid,
        showInstallModal,
        setShowInstallModal,
        showBanner,
        setShowBanner,
        promptInstall,
        dismissBanner,
      }}
    >
      {children}
    </PwaContext.Provider>
  );
};

export const usePwa = () => {
  const context = useContext(PwaContext);
  if (!context) {
    throw new Error('usePwa must be used within a PwaProvider');
  }
  return context;
};

export default PwaContext;
