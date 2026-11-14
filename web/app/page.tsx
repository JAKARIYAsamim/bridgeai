"use client";
// A-01 Welcome
import { HeartHandshake, KeyRound, LogIn, Sparkles, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { HOME } from "@/components/shells";
import { Button, Card } from "@/components/ui";
import { useSession } from "@/lib/hooks";

export default function Welcome() {
  const { user } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (user) router.replace(HOME[user.role]);
  }, [user, router]);

  return (
    <main className="mx-auto flex min-h-[calc(100vh-28px)] max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-8 text-center rise">
        <div className="mx-auto mb-4 grid size-20 place-items-center rounded-3xl bg-primary text-white shadow-[0_18px_40px_-14px_var(--primary)]">
          <Sparkles className="size-10" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">BridgeAI</h1>
        <p className="mt-2 text-lg text-text-2">Therapist and family, together between sessions.</p>
        <p className="bn mt-1 text-lg text-text-2">থেরাপিস্ট আর পরিবার — সেশনের মাঝেও একসাথে।</p>
      </div>
      <Card className="space-y-3 rise">
        <Button href="/login" size="lg" block icon={<LogIn className="size-5" />}>Log in</Button>
        <Button href="/join" size="lg" variant="soft" block icon={<KeyRound className="size-5" />}>
          Join with code <span className="bn font-medium">· কোড দিয়ে যোগ দিন</span>
        </Button>
        <Button href="/signup" size="lg" variant="ghost" block icon={<UserPlus className="size-5" />}>Sign up as a therapist or centre</Button>
      </Card>
      <p className="mt-6 flex items-center justify-center gap-2 text-center text-sm text-muted">
        <HeartHandshake className="size-4" /> Parents join through their therapist&apos;s invite code.
      </p>
    </main>
  );
}
