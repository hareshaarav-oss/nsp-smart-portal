import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { HydrateGate } from "@/components/nss/hydrate-gate";
import { NspPwaRoot } from "@/components/nss/nsp-pwa";
import { Toaster } from "sonner";
import appCss from "../styles.css?url";

const APP_NAME = "NSP";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      { name: "theme-color", content: "#13294b" },
      { name: "apple-mobile-web-app-title", content: "NSP" },
      { name: "application-name", content: "NSP" },
      {
        name: "description",
        content:
          "NSS Smart Portal for S.D. Arts and Shah B.R. Commerce College, Mansa — volunteers, attendance, reports, and notices.",
      },
    ],
    links: [
      { rel: "icon", type: "image/png", href: "/icon-192.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
      { rel: "apple-touch-icon", href: "/icon-180.png" },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "stylesheet", href: appCss },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600;700&family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Source+Sans+3:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Noto+Sans+Gujarati:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  component: () => (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <PreviewHostBridge />
        <AuthProvider>
          <HydrateGate>
            <NspPwaRoot />
            <Outlet />
          </HydrateGate>
          <Toaster position="top-center" richColors />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
