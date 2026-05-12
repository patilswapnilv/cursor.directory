import "./globals.css";
import { OpenPanelComponent } from "@openpanel/nextjs";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { JoinCTA } from "@/components/join-cta";
import { GlobalModals } from "@/components/modals/global-modals";
import { ScrollToTop } from "@/components/scroll-to-top";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { cursorGothic } from "@/styles/fonts";

export const metadata: Metadata = {
  title: {
    default: "Cursor Directory",
    template: "%s | Cursor Directory",
  },
  description:
    "Discover plugins, MCP servers, rules, and resources for Cursor — the AI code editor. Join thousands of developers.",
  icons: [
    {
      rel: "icon",
      url: "/favicon.svg",
    },
  ],
  metadataBase: new URL("https://cursor.directory"),
  openGraph: {
    title: "Cursor Directory",
    description:
      "Discover plugins, MCP servers, rules, and resources for Cursor — the AI code editor.",
    url: "https://cursor.directory",
    siteName: "Cursor Directory",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cursor Directory",
    description:
      "Discover plugins, MCP servers, rules, and resources for Cursor — the AI code editor.",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f7" },
    { media: "(prefers-color-scheme: dark)", color: "#14120b" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        `${cursorGothic.variable}`,
        "whitespace-pre-line antialiased",
      )}
    >
      <body className="bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NuqsAdapter>
            <ScrollToTop />
            <Header />
            {children}
            <JoinCTA />
            <Footer />

            <Toaster />
            <GlobalModals />
          </NuqsAdapter>
        </ThemeProvider>
      </body>

      <OpenPanelComponent
        clientId={process.env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID!}
        trackScreenViews
        disabled={process.env.NODE_ENV === "development"}
      />
    </html>
  );
}
