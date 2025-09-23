import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default function Home() {
  const token = cookies().get('token')?.value;

  if (token) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }

  return null;
}
