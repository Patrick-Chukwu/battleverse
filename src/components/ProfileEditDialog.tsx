import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { avatars } from "@/data/gameData";
import { useGameStore } from "@/store/gameStore";
import { isServerProfileEnabled } from "@/lib/flags";
import { usernameError } from "@/lib/username";
import { useSession } from "@/hooks/useSession";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";

interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileEditDialog({ open, onOpenChange }: ProfileEditDialogProps) {
  const { profile, setName, setAvatar } = useGameStore();
  const { data: session } = useSession();
  const { data: serverProfile } = useProfile();
  const updateProfile = useUpdateProfile();
  const [name, setNameLocal] = useState(profile.name);
  const [avatar, setAvatarLocal] = useState(profile.avatar);
  const [discoverable, setDiscoverable] = useState(false);

  const onOpen = (next: boolean) => {
    if (next) {
      setNameLocal(profile.name);
      setAvatarLocal(profile.avatar);
      setDiscoverable(serverProfile?.discoverable ?? false);
    }
    onOpenChange(next);
  };

  const save = async () => {
    const err = usernameError(name);
    if (err) {
      toast.error(err);
      return;
    }

    setName(name.trim());
    setAvatar(avatar);

    if (isServerProfileEnabled() && session) {
      try {
        await updateProfile.mutateAsync({
          username: name.trim(),
          avatar,
          discoverable,
        });
        toast.success("Profile saved to your account.");
      } catch (e) {
        const message = e instanceof Error ? e.message : "Could not save.";
        if (message.toLowerCase().includes("unique") || message.includes("23505")) {
          toast.error("That username is taken.");
          return;
        }
        toast.error(message);
        return;
      }
    } else {
      toast.success("Saved on this device. Sign in to sync across devices.");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpen}>
      <DialogContent className="max-w-md rounded-3xl p-6 sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">Edit profile</DialogTitle>
          <DialogDescription className="font-bold">
            {session
              ? "This username is how friends will find you."
              : "Guest edits stay on this device until you sign in."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-name" className="font-black">
              Username
            </Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setNameLocal(e.target.value)}
              className="h-12 rounded-2xl px-4 font-bold"
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-black">Avatar</p>
            <div className="flex flex-wrap gap-2">
              {avatars.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAvatarLocal(a)}
                  className={cn(
                    "rounded-xl bg-muted px-2 py-1 text-2xl",
                    avatar === a && "ring-2 ring-primary"
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
          {session && (
            <label className="flex items-center gap-2 text-sm font-bold">
              <input
                type="checkbox"
                checked={discoverable}
                onChange={(e) => setDiscoverable(e.target.checked)}
                className="size-4 accent-primary"
              />
              Let others find me by username (off by default)
            </label>
          )}
        </div>

        <DialogFooter className="border-0 bg-transparent p-0 sm:justify-stretch">
          <button
            type="button"
            onClick={() => void save()}
            disabled={updateProfile.isPending}
            className="flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-base font-black text-primary-foreground disabled:opacity-50"
          >
            {updateProfile.isPending ? "Saving…" : "Save"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
