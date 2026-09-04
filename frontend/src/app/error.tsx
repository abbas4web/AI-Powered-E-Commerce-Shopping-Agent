'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="text-sm text-muted-foreground max-w-sm">
        An unexpected error occurred. Our team has been notified.
      </p>
      <div className="flex gap-2">
        <Button onClick={reset} variant="outline">Try again</Button>
        <Button asChild>
          <a href="/">Go home</a>
        </Button>
      </div>
    </div>
  );
}
