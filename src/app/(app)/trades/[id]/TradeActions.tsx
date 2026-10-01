"use client";

import { useRef, useState, useTransition } from "react";
import { Camera, CheckCircle, Hourglass, X } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui";
import type { TradeStatus } from "@/lib/trades";
import { cancelTrade, confirmHandover, respondToTrade } from "../actions";

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

function Panel({ children }: { children: React.ReactNode }) {
  return <section className="rounded-lg bg-page p-5 ring-1 ring-inset ring-line md:p-6">{children}</section>;
}

export function TradeActions({
  tradeId,
  userId,
  status,
  isProposer,
  myConfirmed,
  theirConfirmed,
  theirName,
}: {
  tradeId: string;
  userId: string;
  status: TradeStatus;
  isProposer: boolean;
  myConfirmed: boolean;
  theirConfirmed: boolean;
  theirName: string;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const run = (fn: () => Promise<{ error: string | null }>) =>
    start(async () => {
      setError(null);
      const r = await fn();
      if (r.error) setError(r.error);
    });

  const cancel = () => {
    if (!window.confirm(isProposer && status === "proposed" ? "Withdraw this proposal?" : "Call off this trade?")) return;
    run(() => cancelTrade(tradeId));
  };

  async function upload(file: File) {
    setError(null);
    if (!file.type.startsWith("image/")) return setError("Choose an image file.");
    if (file.size > MAX_PHOTO_BYTES) return setError("That photo is over 8 MB.");
    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${tradeId}/${userId}/${Date.now()}.${ext}`;
    const { error: upErr } = await createClient().storage.from("trade-photos").upload(path, file, { contentType: file.type });
    setUploading(false);
    if (upErr) return setError(`Upload failed: ${upErr.message}`);
    setPhotoPath(path);
    setPreview(URL.createObjectURL(file));
  }

  const errorLine = error && (
    <p role="alert" className="mt-3 text-sm text-danger">
      {error}
    </p>
  );

  if (status === "proposed" && !isProposer) {
    return (
      <Panel>
        <h2 className="font-display text-xl font-semibold tracking-tight">{theirName} proposed this trade</h2>
        <p className="mt-1 text-sm text-muted">Accept to agree the meetup. You can still call it off before you meet.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button disabled={pending} onClick={() => run(() => respondToTrade(tradeId, true))}>
            Accept trade
          </Button>
          <Button variant="secondary" disabled={pending} onClick={() => run(() => respondToTrade(tradeId, false))}>
            Decline
          </Button>
        </div>
        {errorLine}
      </Panel>
    );
  }

  if (status === "proposed") {
    return (
      <Panel>
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight">
          <Hourglass size={20} className="text-muted" aria-hidden /> Waiting for {theirName}
        </h2>
        <p className="mt-1 text-sm text-muted">We&apos;ll let you know when they accept or decline.</p>
        <Button variant="danger" size="sm" className="mt-5" disabled={pending} onClick={cancel}>
          Withdraw proposal
        </Button>
        {errorLine}
      </Panel>
    );
  }

  if (status === "accepted" && myConfirmed) {
    return (
      <Panel>
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight">
          <CheckCircle size={20} weight="fill" className="text-pear" aria-hidden /> You confirmed the handover
        </h2>
        <p className="mt-1 text-sm text-muted">
          Waiting for {theirName} to confirm their side. The trade completes when you both have.
        </p>
      </Panel>
    );
  }

  if (status === "accepted") {
    return (
      <Panel>
        <h2 className="font-display text-xl font-semibold tracking-tight">After you meet</h2>
        <p className="mt-1 text-sm text-muted">
          Check the cards, then confirm you received them.{" "}
          {theirConfirmed ? `${theirName} has already confirmed.` : `${theirName} confirms their side too.`}
        </p>

        <div className="mt-5 rounded-md bg-seal/8 p-4 ring-1 ring-inset ring-seal/20">
          <div className="flex items-start gap-3">
            <Camera size={22} className="mt-0.5 shrink-0 text-seal" aria-hidden />
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-medium text-fg">Add a photo of the cards you received</p>
              <p className="mt-0.5 text-muted">Optional, but it protects you both if anything is questioned later. Only you two can see it.</p>
              {preview ? (
                <div className="mt-3 flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="Your handover photo" className="size-20 rounded-md object-cover ring-1 ring-line-2" />
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoPath(null);
                      setPreview(null);
                    }}
                    className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg"
                  >
                    <X size={14} aria-hidden /> Remove
                  </button>
                </div>
              ) : (
                <>
                  <input
                    ref={fileInput}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) upload(f);
                      e.target.value = "";
                    }}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-3"
                    disabled={uploading}
                    onClick={() => fileInput.current?.click()}
                  >
                    <Camera size={16} aria-hidden /> {uploading ? "Uploading…" : "Add photo"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button disabled={pending || uploading} onClick={() => run(() => confirmHandover(tradeId, photoPath))}>
            {photoPath ? "Confirm handover" : "Confirm without photo"}
          </Button>
          <Button variant="danger" size="sm" disabled={pending} onClick={cancel}>
            Call off trade
          </Button>
        </div>
        {errorLine}
      </Panel>
    );
  }

  return null;
}
