import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { WalletProvider } from "@/lib/WalletContext";
import { AgentDataProvider } from "@/context/AgentDataContext";

export const metadata: Metadata = {
  title: "Flox | AI Event Concierge",
  description:
    "AI-guided event discovery with Solana-based ticketing, escrow, and validation.",
};

const themeInitScript = `
(function() {
  try {
    var saved = localStorage.getItem('theme');
    var theme = (saved === 'dark' || saved === 'light') ? saved : 'light';
    document.documentElement.classList.add(theme);
    if (theme === 'dark') {
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#f6f6f8] dark:bg-black text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors duration-300" suppressHydrationWarning>
        <ThemeProvider>
          <WalletProvider>
            <AgentDataProvider>
              {children}
            </AgentDataProvider>
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
