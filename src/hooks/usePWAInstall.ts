import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone || isIOSStandalone);
    };

    const checkIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
      const isInSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
      setIsIOS(isIOSDevice && isInSafari);
    };

    checkInstalled();
    checkIOS();

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = async () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      
      // Track installation in backend
      try {
        await fetch('/api/push/track-install', { method: 'POST' });
        console.log('PWA installation tracked');
      } catch (error) {
        console.error('Failed to track PWA installation:', error);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) {
      return { success: false, reason: 'no-prompt' };
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
        
        // Track installation in backend
        try {
          await fetch('/api/push/track-install', { method: 'POST' });
          console.log('PWA installation tracked via prompt');
        } catch (error) {
          console.error('Failed to track PWA installation:', error);
        }
        
        return { success: true, reason: 'accepted' };
      }
      
      return { success: false, reason: 'dismissed' };
    } catch (error) {
      console.error('Install error:', error);
      return { success: false, reason: 'error' };
    }
  }, [deferredPrompt]);

  return {
    isInstallable,
    isInstalled,
    isIOS,
    install
  };
}
