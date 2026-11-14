"use client";
// Emergency guidance shown to a parent when a safety keyword is found. No AI involved.
import { Phone, ShieldAlert } from "lucide-react";
import { useLoad } from "@/lib/hooks";
import { authService } from "@/lib/services";
import { Button } from "./ui";

export function EmergencyBox({ lang = "bn", compact }: { lang?: "bn" | "en"; compact?: boolean }) {
  const { data: centre } = useLoad(() => authService.getCentre(), []);
  const bn = lang === "bn";
  return (
    <div role="alert" className="rounded-3xl border-2 border-alert/40 bg-alert-soft p-5">
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-0.5 size-7 shrink-0 text-alert" />
        <div>
          <p className={bn ? "bn text-lg font-bold" : "text-lg font-bold"}>{bn ? "জরুরি অবস্থা হলে" : "If this is an emergency"}</p>
          <p className={bn ? "bn mt-1 text-[17px] leading-relaxed" : "mt-1 text-[16px] leading-relaxed"}>
            {bn
              ? "আপনার শিশু আঘাত পেলে বা খিঁচুনি হলে এখনই ৯৯৯-এ কল করুন অথবা নিকটস্থ হাসপাতালে যান।"
              : "If your child is injured or has a seizure, call 999 or go to the nearest hospital."}
          </p>
          {!compact && <p className={bn ? "bn mt-2 text-sm text-text-2" : "mt-2 text-sm text-text-2"}>{bn ? "আপনার থেরাপিস্টকেও জানানো হয়েছে।" : "Your therapist has also been told."}</p>}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <Button href="tel:999" variant="danger" size="lg" icon={<Phone className="size-5" />}><span className={bn ? "bn" : ""}>{bn ? "৯৯৯ কল" : "Call 999"}</span></Button>
        <Button href={`tel:${centre?.phone ?? ""}`} variant="soft" size="lg" icon={<Phone className="size-5" />}><span className={bn ? "bn" : ""}>{bn ? "ক্লিনিকে কল" : "Call clinic"}</span></Button>
      </div>
    </div>
  );
}
