import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { getSupabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/flags";
import { isGeneratedUsername, usernameError } from "@/lib/username";
import { fetchOwnProfile, useUpdateProfile } from "@/hooks/useProfile";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { avatars } from "@/data/gameData";
import type { AgeBand } from "@/lib/database.types";
import { cn } from "@/lib/utils";

type Step = "email" | "otp" | "username";
type Tab = "email" | "phone";

const AGE_BANDS: { id: AgeBand; label: string }[] = [
  { id: "6-8", label: "6–8" },
  { id: "9-12", label: "9–12" },
  { id: "13-16", label: "13–16" },
  { id: "16plus", label: "16+" },
];

const LoginPage = () => {
  const navigate = useNavigate();
  const updateProfile = useUpdateProfile();
  const configured = isSupabaseConfigured();

  const [tab, setTab] = useState<Tab>("email");
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("🦊");
  const [ageBand, setAgeBand] = useState<AgeBand | null>(null);
  const [busy, setBusy] = useState(false);
  const signedInOnce = useRef(false);

  const goGuest = () => navigate("/");

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    const afterSignIn = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;
      const profile = await fetchOwnProfile();
      if (!profile) return;
      if (isGeneratedUsername(profile.username)) {
        setAvatar(profile.avatar);
        setStep("username");
        return;
      }
      if (signedInOnce.current) return;
      signedInOnce.current = true;
      toast.success("Signed in.");
      navigate("/");
    };

    void afterSignIn();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") void afterSignIn();
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const sendOtp = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes("@")) {
      toast.error("Enter a valid email address.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Check your email and open the sign-in link on this device.");
    setStep("otp");
  };

  const verifyOtp = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    if (otp.length < 6) {
      toast.error("Enter the 6-digit code.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: otp,
      type: "email",
    });
    if (error) {
      setBusy(false);
      toast.error(error.message);
      return;
    }
    const profile = await fetchOwnProfile();
    setBusy(false);
    if (profile && isGeneratedUsername(profile.username)) {
      setUsername("");
      setAvatar(profile.avatar);
      setStep("username");
      return;
    }
    toast.success("Signed in.");
    navigate("/");
  };

  const saveUsername = async () => {
    const err = usernameError(username);
    if (err) {
      toast.error(err);
      return;
    }
    try {
      await updateProfile.mutateAsync({
        username: username.trim(),
        avatar,
        age_band: ageBand,
      });
      toast.success("Welcome to Battleverse.");
      navigate("/");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not save username.";
      if (message.toLowerCase().includes("unique") || message.includes("23505")) {
        toast.error("That username is taken.");
        return;
      }
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 pt-24 pb-16">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-card mx-auto max-w-md rounded-3xl p-8 sm:p-10"
      >
        <p className="mb-2 text-center text-5xl">🎮</p>
        <h1 className="mb-2 text-center text-3xl font-black">Sign in</h1>
        <p className="mb-8 text-center text-sm font-bold text-muted-foreground">
          Save your username across devices. Practice still works as a guest.
        </p>

        {!configured && (
          <div className="mb-6 rounded-2xl bg-muted p-4 text-sm font-bold text-muted-foreground">
            Auth is not configured on this deploy. Use Continue as guest, or add
            VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (see docs/PHASE1.md).
          </div>
        )}

        <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1">
          <button
            type="button"
            onClick={() => setTab("email")}
            className={cn(
              "rounded-xl py-2 text-sm font-black transition-colors",
              tab === "email" ? "bg-card text-primary shadow-sm" : "text-muted-foreground"
            )}
          >
            Email
          </button>
          <button
            type="button"
            onClick={() => setTab("phone")}
            className={cn(
              "rounded-xl py-2 text-sm font-black transition-colors",
              tab === "phone" ? "bg-card text-primary shadow-sm" : "text-muted-foreground"
            )}
          >
            Phone
          </button>
        </div>

        {tab === "phone" && (
          <div className="mb-6 rounded-2xl border border-border p-4 text-sm font-bold text-muted-foreground">
            Phone login is stubbed for Phase 1. Use email sign-in for now — phone
            findability lands with challenges (Phase 4).
          </div>
        )}

        {tab === "email" && step === "email" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-black">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-2xl px-4 text-base font-bold"
                disabled={!configured}
              />
            </div>
            <button
              type="button"
              disabled={!configured || busy}
              onClick={() => void sendOtp()}
              className="flex h-14 w-full items-center justify-center rounded-2xl bg-primary text-lg font-black text-primary-foreground shadow-lg transition-transform hover:scale-[1.02] disabled:opacity-50"
            >
              {busy ? "Sending…" : "Send sign-in email"}
            </button>
          </div>
        )}

        {tab === "email" && step === "otp" && (
          <div className="space-y-4">
            <p className="text-sm font-bold text-muted-foreground">
              Open the email sent to {email} and tap the sign-in link (keep this
              tab open). If the email has a 6-digit code instead, type it here.
            </p>
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup>
                  {Array.from({ length: 6 }, (_, i) => (
                    <InputOTPSlot key={i} index={i} className="size-10 text-lg font-black" />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => void verifyOtp()}
              className="flex h-14 w-full items-center justify-center rounded-2xl bg-primary text-lg font-black text-primary-foreground shadow-lg disabled:opacity-50"
            >
              {busy ? "Checking…" : "Verify"}
            </button>
            <button
              type="button"
              className="w-full text-sm font-bold text-muted-foreground underline"
              onClick={() => setStep("email")}
            >
              Use a different email
            </button>
          </div>
        )}

        {step === "username" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="font-black">
                Pick a username
              </Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="star_coder"
                className="h-12 rounded-2xl px-4 text-base font-bold"
              />
              <p className="text-xs font-bold text-muted-foreground">
                3–20 letters, numbers, or underscores. This is how friends find you later.
              </p>
            </div>
            <div>
              <p className="mb-2 text-sm font-black">Avatar</p>
              <div className="flex flex-wrap gap-2">
                {avatars.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAvatar(a)}
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
            <div>
              <p className="mb-2 text-sm font-black">Age band (optional)</p>
              <div className="flex flex-wrap gap-2">
                {AGE_BANDS.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setAgeBand(b.id)}
                    className={cn(
                      "rounded-xl px-3 py-1.5 text-sm font-black",
                      ageBand === b.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              disabled={updateProfile.isPending}
              onClick={() => void saveUsername()}
              className="flex h-14 w-full items-center justify-center rounded-2xl bg-primary text-lg font-black text-primary-foreground shadow-lg disabled:opacity-50"
            >
              {updateProfile.isPending ? "Saving…" : "Save and play"}
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={goGuest}
          className="mt-6 flex h-14 w-full items-center justify-center rounded-2xl border-2 border-border bg-card text-lg font-black hover:border-primary/30 hover:bg-primary/5"
        >
          Continue as guest
        </button>
      </motion.div>
    </div>
  );
};

export default LoginPage;
