import { useEffect, useId, useRef, useState } from 'react';

const GOOGLE_SCRIPT_URL = 'https://accounts.google.com/gsi/client';
const GOOGLE_SCRIPT_TIMEOUT_MS = 12000;
let googleIdentityServicesPromise;

const loadGoogleIdentityServices = () => {
  if (window.google?.accounts?.id) {
    return Promise.resolve(window.google);
  }
  if (googleIdentityServicesPromise) return googleIdentityServicesPromise;

  googleIdentityServicesPromise = new Promise((resolve, reject) => {
    let script = document.querySelector(`script[src="${GOOGLE_SCRIPT_URL}"]`);
    if (script?.dataset.googleIdentityState === 'failed') {
      script.remove();
      script = null;
    }

    const timeout = window.setTimeout(() => {
      if (script) script.dataset.googleIdentityState = 'failed';
      reject(new Error('Google sign-in took too long to load. Check your connection and try again.'));
    }, GOOGLE_SCRIPT_TIMEOUT_MS);

    const loaded = () => {
      window.clearTimeout(timeout);
      if (!window.google?.accounts?.id) {
        if (script) script.dataset.googleIdentityState = 'failed';
        reject(new Error('Google sign-in loaded an invalid response. Please try again.'));
        return;
      }
      if (script) script.dataset.googleIdentityState = 'ready';
      resolve(window.google);
    };
    const failed = () => {
      window.clearTimeout(timeout);
      if (script) script.dataset.googleIdentityState = 'failed';
      reject(new Error('Google sign-in could not be loaded. Check your connection and browser privacy settings.'));
    };

    if (script) {
      if (script.dataset.googleIdentityState === 'ready') {
        loaded();
        return;
      }
      script.addEventListener('load', loaded, { once: true });
      script.addEventListener('error', failed, { once: true });
      return;
    }

    script = document.createElement('script');
    script.src = GOOGLE_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.addEventListener('load', loaded, { once: true });
    script.addEventListener('error', failed, { once: true });
    document.head.appendChild(script);
  }).catch((error) => {
    googleIdentityServicesPromise = undefined;
    throw error;
  });

  return googleIdentityServicesPromise;
};

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
  const [loadAttempt, setLoadAttempt] = useState(0);
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
    setStatus('loading');
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
          context: 'signin',
          ux_mode: 'popup',
          use_fedcm_for_button: true
        });
        targetRef.current.replaceChildren();
        google.accounts.id.renderButton(targetRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: label.includes('Sign') ? 'signin_with' : 'continue_with',
          shape: 'pill',
          logo_alignment: 'left',
          // Google supports a maximum button width of 400px. Keeping the
          // configured value in range avoids inconsistent iframe rendering.
          width: Math.min(400, Math.max(220, targetRef.current.clientWidth || 320))
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
  }, [clientId, instanceId, label, loadAttempt]);

  if (!clientId) {
    return (
      <div aria-live="polite">
        <button
          type="button"
          disabled
          className="flex min-h-12 w-full cursor-not-allowed items-center justify-center gap-3 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest px-4 text-sm font-bold text-on-surface opacity-70 shadow-sm"
        >
          <span aria-hidden="true" className="grid size-6 place-items-center rounded-full bg-white font-black text-[#4285f4] shadow-sm">G</span>
          Continue with Google
        </button>
        <p className="mt-2 text-center text-xs text-secondary">
          Google sign-in needs VITE_GOOGLE_CLIENT_ID in the frontend deployment.
        </p>
      </div>
    );
  }

  return (
    <div aria-live="polite" className={disabled ? 'pointer-events-none opacity-60' : ''}>
      <div className="relative min-h-12 w-full">
        <div
          ref={targetRef}
          data-google-button={instanceId}
          className={`flex min-h-12 w-full justify-center overflow-hidden rounded-2xl ${status === 'ready' ? 'visible' : 'invisible'}`}
        />
        {status !== 'ready' && (
          <button
            type="button"
            disabled={status !== 'error' || disabled}
            onClick={() => setLoadAttempt((attempt) => attempt + 1)}
            className={`absolute inset-0 flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest px-4 text-sm font-bold text-on-surface shadow-sm ${status === 'error' ? 'cursor-pointer hover:border-primary hover:text-primary' : 'cursor-wait'}`}
          >
            <span aria-hidden="true" className="grid size-6 place-items-center rounded-full bg-white font-black text-[#4285f4] shadow-sm">G</span>
            {status === 'error' ? 'Retry Google sign-in' : 'Loading Google sign-in…'}
          </button>
        )}
      </div>
      {status === 'error' && <p className="mt-2 text-center text-xs text-error">Google sign-in is temporarily unavailable. Check that third-party sign-in is allowed, then retry.</p>}
    </div>
  );
};

export default GoogleAuthButton;
