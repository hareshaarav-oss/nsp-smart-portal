import { useEffect, useState, useSyncExternalStore } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((fn) => fn());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function getSnapshot() {
  return deferred;
}

export function NspPwaRoot() {
  useEffect(() => {
    const swTimer = window.setTimeout(() => {
      if ("serviceWorker" in navigator) {
        void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
      }
    }, 2500);
    const onPrompt = (event: Event) => {
      event.preventDefault();
      deferred = event as BeforeInstallPromptEvent;
      emit();
    };
    const onInstalled = () => {
      deferred = null;
      emit();
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.clearTimeout(swTimer);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
  return null;
}

export function useInstallPrompt() {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}

export function InstallNspButton() {
  const prompt = useInstallPrompt();
  const [standalone, setStandalone] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(display-mode: standalone)");
    const nav = window.navigator as Navigator & { standalone?: boolean };
    setStandalone(media.matches || nav.standalone === true);
  }, []);

  async function install() {
    if (!prompt) return;
    setBusy(true);
    try {
      await prompt.prompt();
      await prompt.userChoice;
    } finally {
      setBusy(false);
    }
  }

  if (standalone) {
    return (
      <p className="rounded-md bg-forest/10 px-3 py-2 text-sm text-forest">
        NSP is installed on this device. Look for the NSS emblem on your home screen.
      </p>
    );
  }

  if (prompt) {
    return (
      <Button type="button" size="lg" className="w-full" onClick={() => void install()} disabled={busy}>
        <Download />
        {busy ? "Installing…" : "Install NSP — NSS logo"}
      </Button>
    );
  }

  return (
    <p className="text-sm text-muted-foreground">
      Use the steps below for your phone. On Android Chrome, the install prompt appears when this
      page is opened from the live college link.
    </p>
  );
}
