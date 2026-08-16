import { useEffect, useId, useRef, useState } from 'react';

const GOOGLE_SCRIPT_URL = 'https://accounts.google.com/gsi/client';

const loadGoogleIdentityServices = () => new Promise((resolve, reject) => {
  if (window.google?.accounts?.id) {
    resolve(window.google);
    return;
  }

  const existing = document.querySelector(`script[src="${GOOGLE_SCRIPT_URL}"]`);
  if (existing) {
    existing.addEventListener('load', () => resolve(window.google), { once: true });
    existing.addEventListener('error', () => reject(new Error('Google sign-in could not be loaded.')), { once: true });
    return;
  }

  const script = document.createElement('script');
  script.src = GOOGLE_SCRIPT_URL;
  script.async = true;
  script.defer = true;
  script.onload = () => resolve(window.google);
  script.onerror = () => reject(new Error('Google sign-in could not be loaded.'));
  document.head.appendChild(script);
});

/**
 * Renders the official Google Identity Services button. The Google client ID is
 * deliberately a Vite public value: OAuth browser client IDs identify an app,
 * but are not secrets. The returned ID token is sent straight to our API for
 * verification; the browser never decides whether a user may sign in.
 */
const GoogleAuthButton = ({ onCredential, onError, disabled = false, label = 'Continue with Google' }) => {
  const targetRef = useRef(null);
  const callbackRef = useRef(onCredential);
  const errorRef = useRef(onError);
  const instanceId = useId().replace(/:/g, '');
  const [status, setStatus] = useState('loading');
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

  useEffect(() => {
    callbackRef.current = onCredential;
    errorRef.current = onError;
  }, [onCredential, onError]);

  useEffect(() => {
    if (!clientId) {
      setStatus('unavailable');
      return undefined;
    }

    let disposed = false;
    loadGoogleIdentityServices()
      .then((google) => {
        if (disposed || !google?.accounts?.id || !targetRef.current) return;
        google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (!response?.credential) {
              errorRef.current?.('Google did not return a sign-in credential. Please try again.');
              return;
            }
            callbackRef.current?.(response.credential);
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          context: 'signin'
        });
        targetRef.current.replaceChildren();
        google.accounts.id.renderButton(targetRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: label.includes('Sign') ? 'signin_with' : 'continue_with',
          shape: 'pill',
          logo_alignment: 'left',
          width: Math.max(220, targetRef.current.clientWidth || 320)
        });
        setStatus('ready');
      })
      .catch((error) => {
        if (!disposed) {
          setStatus('error');
          errorRef.current?.(error.message || 'Google sign-in could not be loaded.');
        }
      });

    return () => { disposed = true; };
  }, [clientId, instanceId, label]);

  if (!clientId) {
    return (
      <p className="rounded-xl border border-outline-variant/40 bg-surface-container-low px-3 py-2 text-center text-xs text-secondary">
        Google sign-in is not enabled for this deployment.
      </p>
    );
  }

  return (
    <div aria-live="polite" className={disabled ? 'pointer-events-none opacity-60' : ''}>
      <div ref={targetRef} data-google-button={instanceId} className="flex min-h-11 w-full justify-center overflow-hidden rounded-full" />
      {status === 'loading' && <p className="mt-2 text-center text-xs text-secondary">Loading Google sign-in…</p>}
      {status === 'error' && <p className="mt-2 text-center text-xs text-error">Google sign-in is temporarily unavailable.</p>}
    </div>
  );
};

export default GoogleAuthButton;
