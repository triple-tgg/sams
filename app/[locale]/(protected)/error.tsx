"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { isChunkLoadError, reloadOnceForChunkError } from "@/lib/chunk-error";

export default function Error({ error, reset }: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    const chunkError = isChunkLoadError(error);

    useEffect(() => {
        if (chunkError) {
            reloadOnceForChunkError();
            return;
        }
        console.error("Protected Route Error:", error);
    }, [error, chunkError]);

    if (chunkError) {
        return (
            <div className="space-y-4 p-4">
                <Alert color="info" variant="soft">
                    <Info className="h-5 w-5" />
                    <AlertDescription className="space-y-1">
                        <p className="font-semibold">A new version is available</p>
                        <p className="text-xs opacity-90">Please reload the page to continue.</p>
                    </AlertDescription>
                </Alert>
                <Button onClick={() => window.location.reload()} size="sm">
                    Reload page
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4 p-4">
            <Alert color="destructive" variant="soft">
                <Info className="h-5 w-5" />
                <AlertDescription className="space-y-1">
                    <p className="font-semibold">Something went wrong!</p>
                    {error?.message && (
                        <p className="text-xs opacity-90 font-mono bg-red-100/50 dark:bg-red-950/30 p-2 rounded">
                            {error.message}
                        </p>
                    )}
                    {error?.digest && (
                        <p className="text-[10px] text-muted-foreground">Digest: {error.digest}</p>
                    )}
                </AlertDescription>
            </Alert>
            <Button onClick={() => reset()} color="destructive" size="sm">
                Try again
            </Button>
        </div>
    );
}
