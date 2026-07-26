import type { Metadata } from "next";
import { Josefin_Sans, Montserrat, Cinzel_Decorative, Griffy } from "next/font/google";
import "./globals.css";
import "cropperjs/dist/cropper.css";

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
    <html
      lang="id"
      className={`${josefinSans.variable} ${montserrat.variable} ${cinzelDecorative.variable} ${griffy.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        {children}
        {/* Eruda Mobile DevTools Console - Inspect langsung di layar HP Android */}
        <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
        <script dangerouslySetInnerHTML={{ __html: "eruda.init();" }} />
      </body>
    </html>
  );
}
