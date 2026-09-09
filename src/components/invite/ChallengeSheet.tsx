import { useState } from "react";
import { toast } from "sonner";
import { Copy, Link2, Search, Swords, UserPlus } from "lucide-react";
import { subjects, type Subject } from "@/data/quizData";
import type { AgeBand } from "@/lib/database.types";
import { isDexieQuestionsEnabled, isInvitesEnabled } from "@/lib/flags";
import {
  rpcCreateInviteCode,
  rpcRedeemInviteCode,
  rpcSearchUsers,
  rpcSendInvite,
  type SearchUserDto,
} from "@/lib/invite-api";
import { classifySearchQuery, inviteShareUrl } from "@/lib/invite-search";
import { enqueueInviteSend } from "@/lib/invite-outbox";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useSession } from "@/hooks/useSession";
import { useBattleStore } from "@/store/useBattleStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface ChallengeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: Subject | null;
  ageBand: string;
}

const PRESENCE_DOT: Record<string, string> = {
  online: "bg-emerald-500",
  idle: "bg-amber-400",
  in_battle: "bg-sky-500",
  offline: "bg-muted-foreground/40",
};

export function ChallengeSheet({ open, onOpenChange, subject, ageBand }: ChallengeSheetProps) {
  const online = useOnlineStatus();
  const { data: session } = useSession();
  const waitForInvite = useBattleStore((s) => s.waitForInvite);
  const joinBattle = useBattleStore((s) => s.joinBattle);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SearchUserDto | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [busy, setBusy] = useState<"search" | "send" | "code" | "join" | null>(null);

  const signedIn = Boolean(session);
  const canAct = isInvitesEnabled() && signedIn && Boolean(subject);

  const runSearch = async () => {
    if (!canAct) return;
    if (!online) {
      toast.error("You need a connection to search for players.");
      return;
    }
    const classified = classifySearchQuery(query);
    if (!classified.query) {
      toast.error("Type a username, email, or phone number.");
      return;
    }
    setBusy("search");
    setResult(null);
    try {
      const found = await rpcSearchUsers(classified.query, classified.kind);
      setResult(found);
      if (!found.found) {
        toast.message("No discoverable player matched that search.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Search failed.");
    } finally {
      setBusy(null);
    }
  };

  const sendTo = async (userId: string, username: string) => {
    if (!subject) {
      toast.error("Pick a subject first.");
      return;
    }
    if (!online) {
      if (isDexieQuestionsEnabled()) {
        await enqueueInviteSend(userId, subject, ageBand as AgeBand);
        toast.message("Challenge queued — it will send when you are back online.");
        onOpenChange(false);
        return;
      }
      toast.error("You need a connection to send a challenge.");
      return;
    }
    setBusy("send");
    try {
      const invite = await rpcSendInvite(userId, subject, ageBand as AgeBand);
      waitForInvite({ ...invite, to_username: invite.to_username ?? username });
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send that challenge.");
    } finally {
      setBusy(null);
    }
  };

  const makeCode = async () => {
    if (!subject) {
      toast.error("Pick a subject first.");
      return;
    }
    if (!online) {
      toast.error("You need a connection to create a shareable code.");
      return;
    }
    setBusy("code");
    try {
      const invite = await rpcCreateInviteCode(subject, ageBand as AgeBand);
      const url = invite.code ? inviteShareUrl(invite.code) : null;
      setShareCode(invite.code);
      setShareUrl(url);
      waitForInvite(invite);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create a code.");
    } finally {
      setBusy(null);
    }
  };

  const joinWithCode = async () => {
    if (!online) {
      toast.error("You need a connection to join a challenge.");
      return;
    }
    setBusy("join");
    try {
      const invite = await rpcRedeemInviteCode(joinCode);
      if (invite.battle_id) {
        joinBattle(invite.battle_id);
        onOpenChange(false);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not join that code.");
    } finally {
      setBusy(null);
    }
  };

  const copyShare = async () => {
    const text = shareUrl ?? shareCode;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Invite link copied.");
    } catch {
      toast.message(text);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[90dvh] w-full gap-0 overflow-y-auto rounded-t-3xl border-t border-border/60 bg-background pb-[env(safe-area-inset-bottom,0px)] sm:max-w-none"
      >
        <SheetHeader className="p-6 pb-2">
          <SheetTitle className="text-2xl font-black tracking-tight">Challenge a rival</SheetTitle>
          <SheetDescription className="font-bold">
            Exact username, or email/phone if they opted in. Under-13 accounts stay hidden from
            email and phone search.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-8 px-6 pb-10">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            {subject ? subjects.find((s) => s.id === subject)?.name : "Pick a subject"} · {ageBand}
          </p>

          <section className="space-y-3">
            <Label htmlFor="challenge-search" className="font-black">
              Find a player
            </Label>
            <div className="flex gap-2">
              <Input
                id="challenge-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="cousin_kemi or email / phone"
                className="h-12 rounded-2xl px-4 font-bold"
                onKeyDown={(e) => {
                  if (e.key === "Enter") void runSearch();
                }}
              />
              <Button
                type="button"
                variant="cta"
                disabled={!canAct || busy !== null}
                onClick={() => void runSearch()}
                className="h-12 rounded-2xl px-4 text-sm"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
            {result?.found && result.id && result.username && (
              <div className="glass-card flex flex-col gap-3 rounded-3xl border border-border/60 p-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="text-3xl">{result.avatar}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-black">{result.username}</p>
                    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      <span
                        className={cn(
                          "inline-block h-2 w-2 rounded-full",
                          PRESENCE_DOT[result.presence ?? "offline"]
                        )}
                      />
                      {result.presence ?? "offline"}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="cta"
                  disabled={busy !== null}
                  onClick={() => void sendTo(result.id as string, result.username as string)}
                  className="h-11 w-full rounded-2xl px-4 text-sm sm:w-auto"
                >
                  <Swords className="mr-2 h-4 w-4" />
                  Challenge
                </Button>
              </div>
            )}
          </section>

          <section className="space-y-3">
            <p className="text-sm font-black">Share a code</p>
            <Button
              type="button"
              variant="ctaSecondary"
              disabled={!canAct || busy !== null}
              onClick={() => void makeCode()}
              className="h-12 w-full rounded-2xl text-sm"
            >
              <Link2 className="mr-2 h-4 w-4" />
              {busy === "code" ? "Creating…" : "Create invite link"}
            </Button>
            {shareCode && (
              <div className="glass-card space-y-2 rounded-3xl p-4">
                <p className="font-black tracking-[0.3em]">{shareCode}</p>
                {shareUrl && (
                  <p className="truncate text-xs font-bold text-muted-foreground">{shareUrl}</p>
                )}
                <Button type="button" variant="outline" onClick={() => void copyShare()} className="w-full rounded-2xl">
                  <Copy className="mr-2 h-4 w-4" />
                  Copy link
                </Button>
              </div>
            )}
          </section>

          <section className="space-y-3">
            <Label htmlFor="join-code" className="font-black">
              Join with a code
            </Label>
            <div className="flex gap-2">
              <Input
                id="join-code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="AB12CD"
                className="h-12 rounded-2xl px-4 font-black tracking-widest"
              />
              <Button
                type="button"
                variant="ctaSecondary"
                disabled={!signedIn || busy !== null || !joinCode.trim()}
                onClick={() => void joinWithCode()}
                className="h-12 rounded-2xl px-4 text-sm"
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
          </section>

          {!online && (
            <p className="text-sm font-bold text-muted-foreground">
              Challenges need a connection. A named invite can queue and send when you reconnect.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
