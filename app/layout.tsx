import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RiverLab · 德州扑克训练桌',
  description: '与四名不同风格的 Bot 对战，记录每一手牌并获得训练建议。',
  openGraph: {
    title: 'RiverLab · 德州扑克训练桌',
    description: '读牌、决策、进化。与四名不同风格的 Bot 对战并复盘每一手。',
    type: 'website',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'RiverLab 德州扑克训练桌' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RiverLab · 德州扑克训练桌',
    description: '读牌、决策、进化。与四名不同风格的 Bot 对战并复盘每一手。',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
