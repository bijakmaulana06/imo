import type { Metadata } from "next";
import { Josefin_Sans, Montserrat, Cinzel_Decorative, Griffy } from "next/font/google";
import "./globals.css";
import "cropperjs/dist/cropper.css";
import MandatoryNotificationBlocker from "@/components/MandatoryNotificationBlocker";
import SiteConfigProvider from "@/components/SiteConfigProvider";
import AudioPlayerProvider from "@/components/AudioPlayerProvider";
import { ViewTransitions } from "next-view-transitions";

const josefinSans = Josefin_Sans({
  variable: "--font-josefin",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const cinzelDecorative = Cinzel_Decorative({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["700", "900"],
});

const griffy = Griffy({
  variable: "--font-griffy",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "IMO 2026 - Innovative Minds Outclass",
  description: "Portal Resmi IMO 2026: Different Minds, Different Stories, One Generation Chasing Glories.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ViewTransitions>
      <html
        lang="id"
        className={`${josefinSans.variable} ${montserrat.variable} ${cinzelDecorative.variable} ${griffy.variable} h-full antialiased dark`}
      >
        <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
          <SiteConfigProvider>
            <AudioPlayerProvider>
              <MandatoryNotificationBlocker>
                {children}
              </MandatoryNotificationBlocker>
            </AudioPlayerProvider>
          </SiteConfigProvider>
        </body>
      </html>
    </ViewTransitions>
  );
}
