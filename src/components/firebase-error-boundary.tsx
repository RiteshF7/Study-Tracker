"use client";

import React, { useEffect, useState } from "react";
import { firebaseConfig } from "@/firebase/config";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export function FirebaseErrorBoundary({ children }: { children: React.ReactNode }) {
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        // Check if critical config is missing
        if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
            setHasError(true);
        }
    }, []);

    if (hasError) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-background">
                <Card className="w-full max-w-md border-destructive/50">
                    <CardHeader>
                        <div className="flex items-center gap-2 text-destructive mb-2">
                            <AlertTriangle className="h-6 w-6" />
                            <CardTitle>Configuration Error</CardTitle>
                        </div>
                        <CardDescription>
                            The application cannot connect to Firebase services.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            This usually means the environment variables are missing or incorrect.
                        </p>
                        <div className="bg-muted p-3 rounded-md text-xs font-mono overflow-x-auto">
                            <p>Missing keys in .env.local:</p>
                            <ul className="list-disc list-inside mt-1 text-destructive">
                                {!firebaseConfig.apiKey && <li>NEXT_PUBLIC_FIREBASE_API_KEY</li>}
                                {!firebaseConfig.authDomain && <li>NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN</li>}
                                {!firebaseConfig.projectId && <li>NEXT_PUBLIC_FIREBASE_PROJECT_ID</li>}
                            </ul>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => window.location.reload()}
                        >
                            Reload Application
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return <>{children}</>;
}
