import "server-only";

import { ApplicationStatus, SentVia } from "@/generated/prisma/enums";
import { applyStatusChange } from "@/lib/status-changes";
import { logServerError } from "@/lib/log";
import { prisma } from "@/lib/prisma";

/**
 * "Send with hunt" (the fork's own): the Indian-portal engine hunt applies for
 * real — its own sessions, its own guardrails (daily caps, the stop flag,
 * screening questions refused) — and this application's stage follows.
 */
export class HuntError extends Error {
  constructor(
    reason: "unavailable" | "not-configured" | "failed",
    message: string,
  ) {
    super(message);
  }
}

const HUNT_URL = process.env.HUNT_URL ?? "http://127.0.0.1:8788";

export async function sendApplicationWithHunt(applicationId: string): Promise<{ reason: string }> {
  if (!process.env.HUNT_TOKEN) throw new HuntError("not-configured", "Set HUNT_TOKEN for the hunt engine first.");
  const application = await prisma.application.findUnique({ where: { id: applicationId } });
  if (!application) throw new HuntError("unavailable", "That application no longer exists.");
  const postingUrl = application.postingUrl || "";
  if (!postingUrl) throw new HuntError("unavailable", "This application has no posting to apply through.");

  let data: { ok?: boolean; reason?: string; status?: string } = null as never;
  try {
    const r = await fetch(HUNT_URL + "/api/v1/apply", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer " + process.env.HUNT_TOKEN },
      body: JSON.stringify({
        url: postingUrl,
        title: application.role || application.title,
        company: application.company,
        description: (application.postingText || "").slice(0, 2000),
        lane: "jobs",
      }),
      signal: AbortSignal.timeout(150_000),
    });
    data = (await r.json().catch(() => null)) as typeof data;
  } catch (error) {
    logServerError("hunt apply", error);
    throw new HuntError("failed", "The hunt engine didn't answer.");
  }
  if (!data?.ok) throw new HuntError("failed", data?.reason || "The hunt engine refused to apply.");

  if (application.status === ApplicationStatus.DRAFT) {
    const change = await applyStatusChange(prisma, applicationId, ApplicationStatus.SENT, new Date(), {
      sentVia: SentVia.PORTAL,
    });
    if (change.outcome !== "changed") return { reason: data.reason ?? "applied" };
  }
  return { reason: data.reason ?? "applied" };
}
