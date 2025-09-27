import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/context/auth-provider';
import { cookies } from 'next/headers';
import { verifyJwt } from '@/lib/auth';
import localFont from 'next/font/local';

const helvetica = localFont({
  variable: '--font-helvetica',
  display: 'swap',
  src: [
    {
      path: '../../public/fonts/helveticaReguler/HelveticaNeueLTW0545Light.otf',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../../public/fonts/helveticaReguler/HelveticaNeueLTW0555Roman.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/helveticaBold/HelveticaforTarget-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../../public/fonts/helveticaReguler/HelveticaNeueLTW0585Heavy.otf',
      weight: '800',
      style: 'normal',
    },
  ],
});

export const metadata: Metadata = {
  title: 'SEIIKI',
  description: 'PT. SOLUSI ENERGI KELISTRIKAN INDONESIA',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const user = token ? await verifyJwt(token) : null;

  return (
    <html lang="en" className="h-full">
      <body className={`${helvetica.variable} font-sans antialiased h-full`}>
        <AuthProvider initialUser={user}>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
