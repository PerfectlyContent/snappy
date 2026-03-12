import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import './InstallPrompt.css';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Don't show if already installed or previously dismissed
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (navigator.standalone) return;
    if (sessionStorage.getItem('snappy_install_dismissed')) return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Small delay so it doesn't flash on page load
      setTimeout(() => setVisible(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
    }
    setDeferredPrompt(null);
    setInstalling(false);
  };

  const handleDismiss = () => {
    setVisible(false);
    sessionStorage.setItem('snappy_install_dismissed', '1');
  };

  if (!visible) return null;

  return (
    <div className={`install-prompt ${visible ? 'install-prompt--visible' : ''}`}>
      <div className="install-prompt__content">
        <div className="install-prompt__icon">
          <Download size={20} />
        </div>
        <div className="install-prompt__text">
          <span className="install-prompt__title">Install Snappy</span>
          <span className="install-prompt__subtitle">Add to home screen for quick access</span>
        </div>
      </div>
      <div className="install-prompt__actions">
        <button
          className="install-prompt__install"
          onClick={handleInstall}
          disabled={installing}
        >
          {installing ? 'Installing…' : 'Install'}
        </button>
        <button
          className="install-prompt__dismiss"
          onClick={handleDismiss}
          aria-label="Dismiss"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
