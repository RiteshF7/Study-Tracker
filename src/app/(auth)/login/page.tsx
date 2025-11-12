
'use client';

import { initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import { useAuth, useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { BookOpenCheck } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';

export default function LoginPage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/home');
    }
  }, [user, isUserLoading, router]);

  const handleGoogleSignIn = () => {
    initiateGoogleSignIn(auth);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
            <div className="flex justify-center items-center gap-4">
                <BookOpenCheck className="w-12 h-12 text-primary" />
                <h1 className="text-4xl font-bold font-headline">StudyTrack</h1>
            </div>
          <p className="text-muted-foreground">
            Your intelligent journal for academic excellence.
          </p>
        </div>
        <div className="text-center">
          <Button
            onClick={handleGoogleSignIn}
            size="lg"
            className="w-full"
            disabled={isUserLoading}
          >
            <FcGoogle className="mr-2 h-5 w-5" />
            Sign in with Google
          </Button>
        </div>
      </div>
    </div>
  );
}

