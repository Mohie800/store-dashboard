"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SessionProvider, signOut, useSession } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { CssBaseline, CssVarsProvider, extendTheme } from "@mui/joy";

type ProvidersProps = {
  children: ReactNode;
};

function SessionGuard({ children }: ProvidersProps) {
  const { status } = useSession();
  const pathname = usePathname();
  const signingOutRef = useRef(false);

  useEffect(() => {
    // Ensure the user is redirected when the session becomes invalid
    const isAuthRoute = pathname === "/login";

    if (status === "authenticated") {
      signingOutRef.current = false;
      return;
    }

    if (
      status === "unauthenticated" &&
      !isAuthRoute &&
      !signingOutRef.current
    ) {
      signingOutRef.current = true;
      void signOut({ callbackUrl: "/login" });
    }
  }, [status, pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const originalFetch = window.fetch.bind(window);

    window.fetch = async (...args) => {
      const response = await originalFetch(...args);

      if (
        response.status === 401 &&
        !signingOutRef.current &&
        pathname !== "/login"
      ) {
        signingOutRef.current = true;
        void signOut({ callbackUrl: "/login" });
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [pathname]);

  return <>{children}</>;
}

export default function Providers({ children }: ProvidersProps) {
  const theme = extendTheme({
    fontFamily: {
      body: "var(--font-noto-sans-arabic), system-ui, sans-serif",
      display: "var(--font-noto-sans-arabic), system-ui, sans-serif",
      code: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    },
  });

  return (
    <SessionProvider>
      <CssVarsProvider theme={theme} defaultMode="system">
        <CssBaseline />
        <SessionGuard>{children}</SessionGuard>
      </CssVarsProvider>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 4000,
          style: {
            fontFamily: "var(--font-noto-sans-arabic), sans-serif",
            direction: "rtl",
            textAlign: "right",
          },
          success: {
            style: {
              background: "#10B981",
              color: "#fff",
            },
          },
          error: {
            style: {
              background: "#EF4444",
              color: "#fff",
            },
          },
        }}
      />
    </SessionProvider>
  );
}
