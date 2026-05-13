import "./globals.css";
import { ToastProvider } from "../components/ui/ToastProvider";
import { NetworkStatus } from "../components/ui/NetworkStatus";

export const metadata = {
  title: "Eduplexo — School Workspace",
  description: "Multi-school SaaS school workspace"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
        <ToastProvider />
        <NetworkStatus />
      </body>
    </html>
  );
}
