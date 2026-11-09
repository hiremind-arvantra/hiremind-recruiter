"use client";

import { useState } from "react";
import { assetPath } from "@/lib/assetPath";
import { ImageStage } from "@/components/ui/ImageStage";
import { Tilt } from "@/components/ui/Tilt";

/**
 * Decorative illustration for the registration panels, presented on a lit stage.
 *
 * Removes itself (stage included) if the file cannot be loaded. These images are
 * atmosphere, not information, so a missing or renamed asset should leave a clean gap
 * rather than a broken-image icon on the first page a new customer sees.
 */
export default function Illustration({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <Tilt>
      <ImageStage tone="cobalt" rings={false} className="px-3 pt-3 pb-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={assetPath(src)}
          alt={alt}
          onError={() => setFailed(true)}
          className="relative w-full rounded-stage bg-white object-contain shadow-elevated ring-1 ring-ink-200/60"
        />
      </ImageStage>
    </Tilt>
  );
}
