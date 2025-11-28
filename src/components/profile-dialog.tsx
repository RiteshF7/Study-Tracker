'use client';

import { useState } from 'react';
import { useUser, useFirebase } from '@/firebase';
import { updateProfile } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

export function ProfileDialog() {
    const { user } = useUser();
    const { auth } = useFirebase(); // We need auth instance if we were doing more complex stuff, but user object from useUser might be enough if it's the auth user. 
    // Actually useUser returns the User object from firebase/auth which has updateProfile.
    // Wait, updateProfile is a function from 'firebase/auth' that takes the user object.

    const [isOpen, setIsOpen] = useState(false);
    const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleSave = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            await updateProfile(user, { photoURL: photoURL });
            toast({
                title: "Profile Updated",
                description: "Your profile picture has been updated successfully.",
            });
            setIsOpen(false);
            // Force a reload or state update might be needed if the UI doesn't react automatically, 
            // but usually Firebase auth state listeners handle this.
            window.location.reload(); // Simple way to ensure avatar updates everywhere
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to update profile.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-10 w-10 rounded-full overflow-hidden border border-border hover:opacity-80 transition-opacity"
                >
                    <Avatar className="h-full w-full">
                        <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'User'} />
                        <AvatarFallback>{user?.displayName?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>
                        Update your profile picture. Enter a direct URL to an image.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex justify-center mb-4">
                        <Avatar className="h-24 w-24 border-2 border-border">
                            <AvatarImage src={photoURL} alt="Preview" />
                            <AvatarFallback>Preview</AvatarFallback>
                        </Avatar>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="photo-url" className="text-right">
                            Photo URL
                        </Label>
                        <Input
                            id="photo-url"
                            value={photoURL}
                            onChange={(e) => setPhotoURL(e.target.value)}
                            className="col-span-3"
                            placeholder="https://example.com/me.jpg"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" onClick={handleSave} disabled={isLoading}>
                        {isLoading ? "Saving..." : "Save changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
