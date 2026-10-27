import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Feriados municipais de SP",
  description:
    "Calendário de feriados municipais das cidades do estado de São Paulo, com fontes oficiais.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen flex flex-col">
        <header className="site-topo">
          <div className="site-topo-interno">
            <Link href="/" className="site-marca">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="4" width="18" height="17" rx="3" />
                <path d="M8 2v4M16 2v4M3 10h18" />
                <circle cx="12" cy="15.5" r="1.6" fill="currentColor" stroke="none" />
              </svg>
              Feriados municipais SP
            </Link>
            <nav className="site-nav">
              <Link href="/">Calendário</Link>
              <Link href="/contribuir">Contribuir</Link>
            </nav>
          </div>
        </header>

        {children}

        <footer className="site-rodape">
          Projeto de extensão universitária. As informações vêm de contribuições
          revisadas e podem estar incompletas: confirme sempre na prefeitura da cidade.
        </footer>
      </body>
    </html>
  );
}
