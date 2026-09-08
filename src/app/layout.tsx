import type { Metadata, Viewport } from "next";
import { Playfair_Display, Lora } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Auguri — Compleanni di oggi",
  description:
    "Invia auguri di compleanno con Telegram, WhatsApp o SMS. Nessun contatto va mai 'bruciato': puoi sempre riprovare con un altro canale o ripristinare la card.",
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#EFE9DB",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body
        className={`${playfair.variable} ${lora.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
