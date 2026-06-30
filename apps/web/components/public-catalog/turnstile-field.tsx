"use client";

import Script from "next/script";
import { useEffect, useId, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback": () => void;
          "error-callback": () => void;
          theme?: "light" | "dark" | "auto";
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove?: (widgetId: string) => void;
    };
  }
}

type TurnstileFieldProps = {
  siteKey?: string;
  resetKey: number;
  onTokenChange: (token: string | null) => void;
};

export function TurnstileField({
  siteKey,
  resetKey,
  onTokenChange,
}: TurnstileFieldProps) {
  const containerId = useId().replace(/:/g, "_");
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const widgetIdRef = useRef<string | null>(null);
  const tokenChangeRef = useRef(onTokenChange);

  useEffect(() => {
    tokenChangeRef.current = onTokenChange;
  }, [onTokenChange]);

  useEffect(() => {
    if (
      !siteKey ||
      !isScriptLoaded ||
      !window.turnstile ||
      widgetIdRef.current
    ) {
      return;
    }

    widgetIdRef.current = window.turnstile.render(`#${containerId}`, {
      sitekey: siteKey,
      theme: "light",
      callback: (token) => tokenChangeRef.current(token),
      "expired-callback": () => tokenChangeRef.current(null),
      "error-callback": () => tokenChangeRef.current(null),
    });

    return () => {
      if (widgetIdRef.current && window.turnstile?.remove) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [containerId, isScriptLoaded, siteKey]);

  useEffect(() => {
    if (!widgetIdRef.current || !window.turnstile) {
      return;
    }

    window.turnstile.reset(widgetIdRef.current);
    tokenChangeRef.current(null);
  }, [resetKey]);

  if (!siteKey) {
    return null;
  }

  return (
    <div>
      <Script
        id="cloudflare-turnstile"
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setIsScriptLoaded(true)}
      />
      <div id={containerId} className="min-h-16" />
    </div>
  );
}
