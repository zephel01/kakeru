import type { Metadata, Viewport } from "next";
import Header from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kakeru — AIコンテンツ作成補助",
  description:
    "Zenn / note / X 特化のAIライティング支援。日本語最適化＋ローカルLLMプライベートモード。",
  manifest: "/manifest.json",
  applicationName: "Kakeru",
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen antialiased">
        <Header />
        {children}
      </body>
    </html>
  );
}
