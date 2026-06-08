import type { Metadata } from 'next'
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'FluencyCert',
  description: 'Prove Your English Fluency with a Verified Speaking Certificate',
}

export default function RootPage() {
  redirect('/en');
}
