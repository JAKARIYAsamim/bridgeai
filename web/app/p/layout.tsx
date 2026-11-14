import { ParentShell } from "@/components/shells";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ParentShell>{children}</ParentShell>;
}
