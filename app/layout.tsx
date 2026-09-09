import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Te Ao Hou | Whenua, whānau, future', description: 'A guided place for whānau to navigate whenua, succession, trusts and housing.' };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }
