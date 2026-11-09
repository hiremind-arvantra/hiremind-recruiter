"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/api/config";

/*
 * Gate for everything behind a login: the candidate and recruiter shells.
 *
 * Before this the shells rendered for anyone — the data calls failed, but the page,
 * the navigation and whatever the browser had cached were all still on screen. Worse,
 * the browser's back/forward cache would put a signed-out user straight back into the
 * app: log out (or walk back to the login page), press Forward, and the restored page
 * came back intact because nothing re-checked the session.
 *
 * So the check runs on mount — which covers back/forward inside the app, since leaving
 * for /login unmounts this shell — and again on `pageshow`, which is the one event a
 * back/forward-cache restore does fire. Without a token the visitor is sent to /login
 * with `replace`, so Back does not bounce them into the app again, and the shell renders
 * nothing in the meantime rather than flashing its chrome.
 *
 * This is a client-side gate: it decides what is *shown*, never what is *allowed*. Every
 * request still carries the bearer token and every service checks it.
 */
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const check = () => {
      if (getAccessToken()) {
        setAllowed(true);
        return;
      }
      setAllowed(false);
      const next = pathname && pathname !== "/" ? `?next=${encodeURIComponent(pathname)}` : "";
      router.replace(`/login${next}`);
    };

    check();
    // Fires on a back/forward-cache restore, where no component ever remounts.
    window.addEventListener("pageshow", check);
    // Signing out in another tab should not leave this one open.
    window.addEventListener("storage", check);
    return () => {
      window.removeEventListener("pageshow", check);
      window.removeEventListener("storage", check);
    };
  }, [router, pathname]);

  if (!allowed) return null;
  return <>{children}</>;
}
