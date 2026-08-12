"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

// Opens the webcam, lets the employee snap a photo, uploads it to the
// "clock-photos" storage bucket under clock-photos/{user_id}/{timestamp}.jpg,
// then hands the resulting storage path back via onCaptured. This is the
// "proof of presence" required alongside every clock-in - clock-services
// stores the path on clock_records.photo_url.
export default function ClockPhotoCapture({ userId, onCaptured, onCancel }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [status, setStatus] = useState("loading"); // loading | ready | captured | uploading | error
  const [errorMessage, setErrorMessage] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setStatus("ready");
      } catch {
        if (!cancelled) {
          setStatus("error");
          setErrorMessage(
            "Camera access denied. Enable your camera to clock in."
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  function handleTakePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    setPhotoDataUrl(canvas.toDataURL("image/jpeg", 0.85));
    setStatus("captured");

    streamRef.current?.getTracks().forEach((track) => track.stop());
  }

  function handleRetake() {
    setPhotoDataUrl(null);
    setStatus("loading");
    setErrorMessage("");

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setStatus("ready");
      })
      .catch(() => {
        setStatus("error");
        setErrorMessage(
          "Camera access denied. Enable your camera to clock in."
        );
      });
  }

  async function handleConfirm() {
    if (!photoDataUrl) return;

    setStatus("uploading");
    setErrorMessage("");

    try {
      const blob = await (await fetch(photoDataUrl)).blob();
      const path = `${userId}/${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("clock-photos")
        .upload(path, blob, { contentType: "image/jpeg" });

      if (uploadError) {
        setStatus("error");
        setErrorMessage("Could not upload photo. Try again.");
        return;
      }

      onCaptured(path);
    } catch {
      setStatus("error");
      setErrorMessage("Could not upload photo. Try again.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-xl">
        <h3 className="mb-1 text-sm font-semibold text-foreground">
          Confirm you're here
        </h3>
        <p className="mb-4 text-xs text-muted-foreground">
          A photo is required with every clock-in as proof of presence.
        </p>

        <div className="relative mb-4 aspect-square w-full overflow-hidden rounded-xl bg-muted">
          {status !== "captured" && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover [transform:scaleX(-1)]"
            />
          )}

          {status === "captured" && photoDataUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={photoDataUrl}
              alt="Captured clock-in photo"
              className="h-full w-full object-cover [transform:scaleX(-1)]"
            />
          )}

          {status === "loading" && (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
              Starting camera…
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        {errorMessage && (
          <p className="mb-3 text-xs font-semibold text-rose-600 dark:text-rose-400">
            {errorMessage}
          </p>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
          >
            Cancel
          </button>

          {status === "captured" ? (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
              >
                Retake
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={status === "uploading"}
                className="flex-1 rounded-xl bg-brand-dark px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand disabled:cursor-not-allowed disabled:bg-muted"
              >
                {status === "uploading" ? "Uploading…" : "Confirm"}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleTakePhoto}
              disabled={status !== "ready"}
              className="flex-1 rounded-xl bg-brand-dark px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand disabled:cursor-not-allowed disabled:bg-muted"
            >
              Take Photo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}