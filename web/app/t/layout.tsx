import { TherapistShell } from "@/components/shells";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <TherapistShell>{children}</TherapistShell>;
}
