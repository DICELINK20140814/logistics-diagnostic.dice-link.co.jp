import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "原油高対応 物流利益改善診断",
  description:
    "原油高によるコスト増と物流最適化による改善余地を可視化する物流会社向け診断ツール",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="flex min-h-screen flex-col">
        <div className="flex-1">{children}</div>
        <footer className="border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} DICE LINK, Inc.
        </footer>
      </body>
    </html>
  );
}
