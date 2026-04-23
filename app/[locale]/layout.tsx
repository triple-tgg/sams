import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import MountedProvider from "@/providers/mounted.provider";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
const inter = Inter({ subsets: ["latin"] });
// language
import { getLangDir } from "rtl-detect";
import { NextIntlClientProvider } from "next-intl";
import DirectionProvider from "@/providers/direction-provider";
import AuthProvider from "@/providers/auth.provider";
import ReactQueryProviders from "@/providers/reactQuery.providers";

export const metadata: Metadata = {
  title: "SAMs Airline",
  description: "SAMs Airline Maintainance",
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const direction = getLangDir(locale);
  return (
    <html lang={locale} dir={direction} suppressHydrationWarning>
      <body className={`${inter.className} dashcode-app `}>
        <ReactQueryProviders>
          <NextIntlClientProvider>
            <AuthProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="light"
                enableSystem
                disableTransitionOnChange
              >
                <MountedProvider>
                  <DirectionProvider direction={direction}>
                    {children}
                  </DirectionProvider>
                </MountedProvider>
                {/* <Toaster /> */}
                <SonnerToaster position="top-center" richColors />
              </ThemeProvider>
            </AuthProvider>
          </NextIntlClientProvider>
        </ReactQueryProviders>
      </body>
    </html>
  );
}
