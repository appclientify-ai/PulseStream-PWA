
import { useState, useEffect } from 'react';

export type DeviceCategory = 'mobile' | 'tablet' | 'desktop' | 'macbook';

export const usePWA = () => {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const [isWindows, setIsWindows] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [detectedCategory, setDetectedCategory] = useState<DeviceCategory>('desktop');

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detect if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsStandalone(true);
    }

    // Detect device environment
    const ua = window.navigator.userAgent.toLowerCase();
    const maxTouchPoints = window.navigator.maxTouchPoints || 0;

    const iosCheck = /iphone|ipad|ipod/.test(ua) || (navigator.platform === 'MacIntel' && maxTouchPoints > 1);
    const androidCheck = /android/.test(ua);
    const macCheck = /macintosh|mac os x/.test(ua) && !(navigator.platform === 'MacIntel' && maxTouchPoints > 1);
    const winCheck = /windows|win32|win64/.test(ua);

    const ipadCheck = /ipad/.test(ua) || (navigator.platform === 'MacIntel' && maxTouchPoints > 1);
    const tabletCheck = ipadCheck || (/android/.test(ua) && !/mobile/.test(ua)) || (window.innerWidth >= 640 && window.innerWidth <= 1024 && maxTouchPoints > 0);
    const mobileCheck = !tabletCheck && (/mobile|iphone|ipod/.test(ua) || (/android/.test(ua) && /mobile/.test(ua)) || (window.innerWidth < 640 && maxTouchPoints > 0));

    setIsIOS(iosCheck);
    setIsAndroid(androidCheck);
    setIsMac(macCheck);
    setIsWindows(winCheck);
    setIsTablet(tabletCheck);
    setIsMobile(mobileCheck);

    if (mobileCheck) {
      setDetectedCategory('mobile');
    } else if (tabletCheck) {
      setDetectedCategory('tablet');
    } else if (macCheck) {
      setDetectedCategory('macbook');
    } else {
      setDetectedCategory('desktop');
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const triggerInstall = async () => {
    if (!installPrompt) return;
    try {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstallPrompt(null);
        setIsStandalone(true);
      }
    } catch (e) {
      console.error('Install prompt error:', e);
    }
  };

  return {
    installPrompt,
    isStandalone,
    isIOS,
    isAndroid,
    isMac,
    isWindows,
    isTablet,
    isMobile,
    detectedCategory,
    triggerInstall,
    canInstall: !!installPrompt
  };
};

