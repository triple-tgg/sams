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
        if (chunkError) reloadOnceForChunkError();
    }, [chunkError]);

    return (
        <div className="space-y-4">
            <Alert color={chunkError ? "info" : "destructive"} variant="soft">
                <Info className="h-5 w-5" />
                <AlertDescription>
                    {chunkError ? "A new version is available. Please reload the page." : "Something went wrong!"}
                </AlertDescription>
            </Alert>
            <Button
                onClick={() => (chunkError ? window.location.reload() : reset())}
                color={chunkError ? "primary" : "destructive"}
                size="sm"
            >
                {chunkError ? "Reload page" : "Try again"}
            </Button>
        </div>
    );
}
