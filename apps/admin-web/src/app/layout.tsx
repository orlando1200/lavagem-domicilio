import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lavagem a Domicilio - Admin',
  description: 'Painel administrativo do Lavagem a Domicilio',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
