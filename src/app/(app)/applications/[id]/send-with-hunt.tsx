"use client";

import { AlertDialog } from "radix-ui";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { sendWithHunt } from "@/lib/jobs/hunt-actions";

/**
 * "Send with hunt" (the fork's own): the hunt engine applies through the
 * Indian portals with its saved sessions, then this application's stage
 * follows. Next to "Send with Gmail" whenever the posting has a link.
 */
export function SendWithHunt({
  applicationId,
  postingUrl,
  sentBefore,
}: {
  applicationId: string;
  postingUrl: string;
  /** It went out through hunt already. */
  sentBefore: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sending, startSending] = useTransition();

  const send = () =>
    startSending(async () => {
      setOpen(false);
      const result = await sendWithHunt({ id: applicationId });
      if (result) return;
      router.refresh();
    });

  return (
    <AlertDialog.Root open={open} onOpenChange={setOpen}>
      <Button
        variant={sentBefore ? "text" : "secondary"}
        size="sm"
        aria-disabled={sending || undefined}
        onClick={() => {
          if (sending) return;
          setOpen(true);
        }}
      >
        {sending ? "Hunt is applying…" : sentBefore ? "Apply again with hunt" : "Send with hunt"}
      </Button>
      <AlertDialog.Content className="fixed top-1/2 left-1/2 z-50 flex w-[min(480px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 flex-col gap-3 rounded-dialog border border-line-popover bg-card p-6 shadow-menu">
        <AlertDialog.Title className="text-lg">
          {sentBefore ? "Apply again with hunt?" : "Send with hunt?"}
        </AlertDialog.Title>
        <AlertDialog.Description>
          The hunt engine applies on the portal with your saved sessions, within its daily caps.
          It stops itself when the portal asks something only you can answer.
        </AlertDialog.Description>
        <div className="flex justify-end gap-2 pt-4">
          <AlertDialog.Cancel>
            <Button variant="secondary" size="sm">
              Keep it here
            </Button>
          </AlertDialog.Cancel>
          <AlertDialog.Action>
            <Button variant="primary" size="sm" onClick={send}>
              {sending ? "Applying…" : "Apply now"}
            </Button>
          </AlertDialog.Action>
        </div>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}
