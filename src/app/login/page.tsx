"use client";

import { Moon, Sun } from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ui/theme-provider";
import { loginWithGoogle } from "@/lib/actions/auth";
import { useI18n } from "@/lib/i18n/context";

const LOGO_URL =
  "https://owptgwolyjbccarfkkfz.supabase.co/storage/v1/object/public/pos-assets/logo/aloer_logo.png";

function LoginForm() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const oauthError = searchParams.get("error");
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const displayError =
    actionError ?? (oauthError ? t.login.signInFailed : null);

  async function handleGoogleSignIn() {
    setLoading(true);
    setActionError(null);
    const result = await loginWithGoogle();
    if (result?.error) {
      setActionError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="flex flex-col items-center gap-4">
        <Image
          src={LOGO_URL}
          alt="Aloer logo"
          width={500}
          height={500}
          className="rounded-xl"
          priority
        />
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t.login.signIn}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t.login.useGoogle}
          </p>
        </div>
      </div>

      {displayError && (
        <p className="text-sm text-red-600 text-center" role="alert">
          {displayError}
        </p>
      )}

      <Button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3"
      >
        {!loading && (
          <svg
            aria-hidden="true"
            width="18"
            height="18"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M47.532 24.552c0-1.636-.146-3.2-.418-4.706H24.48v8.903h12.958c-.558 3.01-2.255 5.565-4.8 7.278v6.048h7.766c4.545-4.183 7.128-10.34 7.128-17.523z"
              fill="#4285F4"
            />
            <path
              d="M24.48 48c6.504 0 11.956-2.156 15.943-5.833l-7.766-6.048c-2.155 1.444-4.912 2.298-8.177 2.298-6.29 0-11.618-4.248-13.522-9.951H3.003v6.24C6.976 42.82 15.132 48 24.48 48z"
              fill="#34A853"
            />
            <path
              d="M10.958 28.466a14.52 14.52 0 0 1-.757-4.466c0-1.55.27-3.058.757-4.466v-6.24H3.003A23.96 23.96 0 0 0 .48 24c0 3.867.927 7.524 2.523 10.706l7.955-6.24z"
              fill="#FBBC05"
            />
            <path
              d="M24.48 9.583c3.546 0 6.726 1.22 9.232 3.617l6.921-6.921C36.427 2.378 30.977 0 24.48 0 15.132 0 6.976 5.18 3.003 13.294l7.955 6.24c1.904-5.703 7.232-9.951 13.522-9.951z"
              fill="#EA4335"
            />
          </svg>
        )}
        {loading ? t.login.redirecting : t.login.continueWithGoogle}
      </Button>
    </div>
  );
}

export default function LoginPage() {
  const { t } = useI18n();
  const { theme, toggleTheme } = useTheme();

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 transition-colors">
      <button
        type="button"
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label={
          theme === "light" ? t.login.switchToDark : t.login.switchToLight
        }
      >
        {theme === "light" ? (
          <Moon className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Sun className="h-5 w-5" aria-hidden="true" />
        )}
      </button>

      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
