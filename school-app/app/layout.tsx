import "./globals.css";
import { ToastProvider } from "../components/ui/ToastProvider";
import { NetworkStatus } from "../components/ui/NetworkStatus";
import { NextAuthProvider } from "../components/NextAuthProvider";

export const metadata = {
  title: "School App",
  description: "Multi-school SaaS school workspace"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <NextAuthProvider>
          {children}
          <ToastProvider />
          <NetworkStatus />
        </NextAuthProvider>
      </body>
    </html>
  );
}
