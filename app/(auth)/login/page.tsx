import LoginPage from "@/modules/auth/components/LoginPage";

import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Login",
  description: "Log in to HireMind to post jobs and review AI-ranked candidates.",
  path: "/login",
});

/*
 * This app serves recruiters only, so the role is fixed rather than picked from a
 * pair of cards or read off the hostname. The marketing site keeps the chooser that
 * sends people here.
 */
export default function Login() {
  return <LoginPage role="recruiter" />;
}
