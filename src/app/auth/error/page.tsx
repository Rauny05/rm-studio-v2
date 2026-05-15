"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const ERROR_MESSAGES: Record<string, string> = {
  Configuration: "Server configuration error. Contact the admin.",
  AccessDenied: "You don't have permission to sign in.",
  Verification: "The verification link is invalid or has expired.",
  OAuthSignin: "Error starting the Google sign-in flow.",
  OAuthCallback: "Error during Google OAuth callback.",
  OAuthCreateAccount: "Could not create your account. Try again.",
  EmailCreateAccount: "Could not create your account. Try again.",
  Callback: "Error in the authentication callback.",
  OAuthAccountNotLinked: "This email is already linked to another provider.",
  Default: "An unexpected error occurred. Please try again.",
};

function AuthErrorContent() {
  const params = useSearchParams();
  const error = params.get("error") ?? "Default";
  const message = ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default;

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#09090b",
      fontFamily: "system-ui, sans-serif",
    }}>
      <div style={{
        background: "#18181b",
        border: "1px solid #27272a",
        borderRadius: "16px",
        padding: "48px",
        maxWidth: "420px",
        width: "100%",
        textAlign: "center",
      }}>
        <div style={{ fontSize: "40px", marginBottom: "16px" }}>⚠️</div>
        <h1 style={{ color: "#fafafa", fontSize: "22px", fontWeight: 600, margin: "0 0 12px" }}>
          Sign-in failed
        </h1>
        <p style={{ color: "#a1a1aa", fontSize: "14px", margin: "0 0 32px", lineHeight: 1.6 }}>
          {message}
        </p>
        <p style={{ color: "#52525b", fontSize: "12px", margin: "0 0 24px" }}>
          Error code: <code style={{ color: "#71717a" }}>{error}</code>
        </p>
        <a
          href="/auth/signin"
          style={{
            display: "inline-block",
            background: "#ffffff",
            color: "#09090b",
            borderRadius: "8px",
            padding: "10px 24px",
            fontSize: "14px",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Try again
        </a>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense>
      <AuthErrorContent />
    </Suspense>
  );
}
