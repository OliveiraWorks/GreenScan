import type { Metadata } from 'next';
import { Inter, Syne } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'GreenScan — Monitoramento de Descarte Irregular',
  description:
    'Plataforma colaborativa de monitoramento e denúncia de descarte irregular de resíduos sólidos. Fotografe, reporte e veja em tempo real no mapa.',
  keywords: [
    'descarte irregular',
    'resíduos sólidos',
    'meio ambiente',
    'fiscalização ambiental',
    'lixo',
    'mapa colaborativo',
  ],
  openGraph: {
    title: 'GreenScan',
    description: 'Monitore e reporte descartes irregulares de resíduos na sua cidade.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${syne.variable}`}>
      <body className="font-inter antialiased bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}
