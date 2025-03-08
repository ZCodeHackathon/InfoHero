import { EnvVarWarning } from "@/components/env-var-warning";
import HeaderAuth from "@/components/header-auth";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Link from "next/link";
import "./globals.css";
import BadgesNav from "@/components/BadgesNav";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "InfoHero",
  description: "InfoHero - Bohaterowie wiarygodności",
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main className="min-h-screen flex flex-col items-center">
            <div className="flex-1 w-full flex flex-col  items-center">
              <nav className="w-full fixed flex justify-center border-b border-b-foreground/10 h-16 bg-white ">
                <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
                  <div className="flex gap-12 items-center font-semibold">
                    <Link href={"/"}>InfoHero</Link>
                    <Link href={"/addPost"}>Dodaj informację</Link>
                    <Link href={"/ranking"}>Wyświetl rankingi</Link>
                    <Link href={"/oNas"}>O nas</Link>
                    <Link
                      href={"https://buymeacoffee.com/"}
                      className="font-extrabold text-yellow-500 hover:text-yellow-600"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Wesprzyj nas!
                    </Link>

                    <div className="flex items-center gap-2"></div>
                  </div>
                  {!hasEnvVars ? <EnvVarWarning /> : <HeaderAuth />}
                </div>
              </nav>

              {/* Update this section to include ad banners */}
              <div className="w-full flex justify-center">
                {/* Left Ad Banner */}
                <div className="hidden xl:block w-[400px] h-[850px] sticky top-4 mt-4">
                  <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500">Ad Space</span>
                  </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 max-w-5xl p-5 mt-12">{children}</div>

                {/* Right Ad Banner */}
                <div className="hidden xl:block w-[400px] h-[850px] sticky top-4 mt-4">
                  <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500">Ad Space</span>
                  </div>
                </div>
              </div>

              <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs">
                <p>Powered by Zcode</p>
                <ThemeSwitcher />
              </footer>
            </div>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
