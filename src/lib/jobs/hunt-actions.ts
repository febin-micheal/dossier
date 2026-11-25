"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { statusInfo } from "@/lib/status";
import { action } from "@/lib/action";
import { sendApplicationWithHunt, HuntError } from "@/lib/jobs/hunt-send";
import { ApplicationStatus } from "@/generated/prisma/enums";

function refreshEverything() {
  return revalidatePath("/", "layout");
}

/** "Send with hunt" (the fork's own): the engine applies on the Indian portals. */
export const sendWithHunt = action(z.object({ id: z.string().min(1) }), async ({ id }, { toast }) => {
  try {
    const sent = await sendApplicationWithHunt(id);
    refreshEverything();
    toast(`Sent through hunt. ${sent.reason}`.trim());
    return null;
  } catch (error) {
    if (error instanceof HuntError) {
      toast(error.message);
      return null;
    }
    throw error;
  }
});
