"use client";
// C-03 Families: phone card list (no horizontal scrolling table)
import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/legacy/icons";
import { Card, EmptyState, ErrorState, SkeletonList } from "@/components/ui";
import { useLoad } from "@/lib/hooks";
import { AGE_BANDS, fmtDate } from "@/lib/labels";
import { authService, childService, feedbackService, planService } from "@/lib/services";

const RELATION: Record<string, string> = {
  mother: "mother",
  father: "father",
  grandparent: "grandparent",
  other: "caregiver",
};

async function loadFamilies() {
  const [children, therapists] = await Promise.all([
    childService.listChildren(),
    authService.listUsers("therapist"),
  ]);
  return Promise.all(
    children.map(async (c) => {
      const [rm, cgs, logs] = await Promise.all([
        planService.getRoadmap(c.id),
        childService.getCaregivers(c.id),
        feedbackService.listLogs(c.id, 60),
      ]);
      return {
        id: c.id,
        nickname: c.nickname,
        ageBand: c.ageBand,
        therapist: therapists.find((t) => t.id === c.therapistId)?.name ?? "—",
        caregivers: cgs.map((g) => `${g.user.name} (${RELATION[g.relation]})`),
        plan: rm ? rm.status : null,
        last: logs
          .map((l) => l.date)
          .sort()
          .pop(),
      };
    })
  );
}

export default function Families() {
  const [q, setQ] = useState("");
  const { data, loading, error, reload } = useLoad(loadFamilies, []);
  const rows = (data ?? []).filter((r) =>
    `${r.nickname} ${r.therapist} ${r.caregivers.join(" ")}`
      .toLowerCase()
      .includes(q.toLowerCase().trim())
  );

  return (
    <div className="pad" style={{ paddingBottom: 88 }}>
      <div className="bar" style={{ padding: "4px 8px 10px" }}>
        <Link href="/c" className="hbtn" aria-label="Back">
          <Icon name="back" />
        </Link>
        <div className="grow" style={{ minWidth: 0, paddingLeft: 6 }}>
          <h1 className="h2" style={{ margin: 0 }}>
            Families
          </h1>
          <p className="small">{data ? `${data.length} children in care` : "Centre families"}</p>
        </div>
      </div>

      <div className="in">
        {/* Search input */}
        <div style={{ marginBottom: 12, position: "relative" }}>
          <input
            className="field"
            style={{ width: "100%", paddingLeft: 36 }}
            placeholder="Search child, therapist or parent…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search families"
          />
          <span
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--mute)",
              pointerEvents: "none",
            }}
          >
            <Icon name="spark" />
          </span>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : loading || !data ? (
          <SkeletonList rows={4} h="h-20" />
        ) : rows.length === 0 ? (
          <EmptyState title={q ? "No families match your search." : "No families yet."} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {rows.map((r) => {
              const tints = ["t-purple", "t-blue", "t-orange", "t-green"];
              const tint = tints[r.nickname.charCodeAt(0) % tints.length];
              return (
                <Card key={r.id} style={{ padding: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span
                      className={`av ${tint}`}
                      style={{ width: 42, height: 42, fontSize: 17 }}
                    >
                      {r.nickname[0]}
                    </span>
                    <div className="grow" style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <p className="h3" style={{ fontSize: 15, margin: 0 }}>
                          {r.nickname}
                        </p>
                        <span className="small">Age {AGE_BANDS[r.ageBand].en}</span>
                      </div>
                      <p className="small" style={{ margin: "2px 0 0" }}>
                        Therapist: {r.therapist}
                      </p>
                    </div>
                    {r.plan === "approved" ? (
                      <span className="pill good">Plan live</span>
                    ) : r.plan === "draft" ? (
                      <span className="pill warn">Draft</span>
                    ) : (
                      <span className="pill line">No plan</span>
                    )}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, borderTop: "1px solid var(--line)", paddingTop: 6 }}>
                    <span className="small">
                      {r.caregivers.length ? r.caregivers.join(", ") : "No caregiver linked"}
                    </span>
                    <span className="small" style={{ color: "var(--mute)" }}>
                      {r.last ? `Active ${fmtDate(r.last)}` : "No recent activity"}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
