import type { Metadata } from 'next';
import './globals.css';
import './brand.css';
export const metadata: Metadata = { title: 'Te Ao Hou | Whenua, whānau, future', description: 'A guided place for whānau to navigate whenua, succession, trusts and housing.', icons: { icon: '/icon.svg', shortcut: '/icon.svg', apple: '/icon.svg' } };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }
