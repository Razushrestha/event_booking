const EVENT_TYPE_IMAGES: Record<string, string> = {
  Festival: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&auto=format&fit=crop",
  Conference: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop",
  Concert: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&auto=format&fit=crop",
  Exhibition: "https://images.unsplash.com/photo-1560185127-978bd788bfed?w=1200&auto=format&fit=crop",
  Wellness: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&auto=format&fit=crop",
  Community: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&auto=format&fit=crop",
  Other: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop",
};

const EVENT_TYPE_GRADIENTS: Record<string, string> = {
  Festival: "from-orange-500 via-red-500 to-rose-600",
  Conference: "from-blue-600 via-indigo-600 to-violet-700",
  Concert: "from-purple-600 via-fuchsia-600 to-pink-600",
  Exhibition: "from-emerald-500 via-teal-600 to-cyan-700",
  Wellness: "from-green-500 via-lime-600 to-emerald-700",
  Community: "from-sky-500 via-blue-500 to-indigo-600",
  Other: "from-slate-600 via-gray-700 to-slate-800",
};

export function getEventImageUrl(
  poster?: string | null,
  eventType?: string | null
): string {
  if (poster) {
    if (poster.startsWith("http://") || poster.startsWith("https://")) {
      return poster;
    }
    return `${import.meta.env.VITE_IMAGE_URL || ""}${poster}`;
  }

  return EVENT_TYPE_IMAGES[eventType || "Other"] || EVENT_TYPE_IMAGES.Other;
}

export function getEventGradient(eventType?: string | null): string {
  return EVENT_TYPE_GRADIENTS[eventType || "Other"] || EVENT_TYPE_GRADIENTS.Other;
}
