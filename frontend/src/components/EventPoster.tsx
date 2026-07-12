import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { getEventGradient, getEventImageUrl } from "@/lib/eventImages";

interface EventPosterProps {
  poster?: string | null;
  eventType?: string | null;
  title: string;
  className?: string;
  imageClassName?: string;
  showFallbackLabel?: boolean;
}

export default function EventPoster({
  poster,
  eventType,
  title,
  className = "",
  imageClassName = "",
  showFallbackLabel = true,
}: EventPosterProps) {
  const [hasError, setHasError] = useState(false);
  const imageUrl = getEventImageUrl(poster, eventType);
  const gradient = getEventGradient(eventType);

  if (hasError) {
    return (
      <div
        className={`relative flex h-full min-h-[12rem] w-full items-center justify-center bg-gradient-to-br ${gradient} ${className}`}
      >
        <div className="px-6 text-center text-white">
          <CalendarDays className="mx-auto mb-3 h-10 w-10 opacity-90" />
          {showFallbackLabel && (
            <>
              <p className="text-sm uppercase tracking-[0.2em] text-white/80">
                {eventType || "Event"}
              </p>
              <p className="mt-2 text-lg font-semibold">{title}</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={title}
      className={imageClassName || className}
      onError={() => setHasError(true)}
      loading="lazy"
    />
  );
}
