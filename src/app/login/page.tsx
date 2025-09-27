import { LoginForm } from '@/components/auth/login-form';
import Image from 'next/image';

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-col justify-center items-center px-6 py-12 lg:px-8 bg-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="flex justify-center">
            <Image src="/logo.png" alt="Logo" width={200} height={200} priority />
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-foreground">
          PT. SOLUSI ENERGI KELISTRIKAN INDONESIA
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
