import type { Metadata } from "next";
import { Suspense } from "react";
import { Login } from "@/components/login";

export const metadata: Metadata = {
  title: "Sign in | Cursor Directory",
  description:
    "Sign in to Cursor Directory to submit plugins, star your favorites, and connect with the community.",
  openGraph: {
    title: "Sign in | Cursor Directory",
    description:
      "Sign in to Cursor Directory to submit plugins, star your favorites, and connect with the community.",
  },
  twitter: {
    title: "Sign in | Cursor Directory",
    description:
      "Sign in to Cursor Directory to submit plugins, star your favorites, and connect with the community.",
  },
};

export default function LoginPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <Suspense fallback={null}>
          <Login />
        </Suspense>
      </div>
    </div>
  );
}
