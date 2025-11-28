'use client';

import { useState, useRef } from 'react';
import { useUser, useStorage } from '@/firebase';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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
    const storage = useStorage();

    const [isOpen, setIsOpen] = useState(false);
    const [previewURL, setPreviewURL] = useState(user?.photoURL || '');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewURL(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            let photoURL = user.photoURL;

            if (selectedFile) {
                if (!storage) throw new Error("Storage not available");

                const storageRef = ref(storage, `users/${user.uid}/profile-picture`);
                await uploadBytes(storageRef, selectedFile);
                photoURL = await getDownloadURL(storageRef);
            }

            if (photoURL !== user.photoURL) {
                await updateProfile(user, { photoURL: photoURL });
                toast({
                    title: "Profile Updated",
                    description: "Your profile picture has been updated successfully.",
                });
                // Force a reload to ensure avatar updates everywhere
                window.location.reload();
            } else {
                setIsOpen(false);
            }

        } catch (error: any) {
            console.error(error);
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
                        Update your profile picture. Upload an image from your device.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex justify-center mb-4">
                        <Avatar className="h-24 w-24 border-2 border-border cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <AvatarImage src={previewURL} alt="Preview" />
                            <AvatarFallback>Preview</AvatarFallback>
                        </Avatar>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="picture" className="text-right">
                            Picture
                        </Label>
                        <Input
                            id="picture"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="col-span-3"
                            ref={fileInputRef}
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
