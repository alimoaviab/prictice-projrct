import "./globals.css";

export const metadata = {
  title: "School App",
  description: "Multi-school SaaS school workspace"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
