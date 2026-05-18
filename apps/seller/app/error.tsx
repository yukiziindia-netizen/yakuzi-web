"use client";
import { useEffect } from "react";
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="text-center space-y-4">
        <div className="text-6xl">⚠️</div>
        <h1 className="font-semibold text-2xl text-foreground">Something went wrong</h1>
        <button onClick={reset} className="h-10 px-4 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">Try Again</button>
      </div>
    </div>
  );
}
