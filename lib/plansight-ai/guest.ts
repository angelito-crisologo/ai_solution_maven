const GUEST_ID_KEY = "plansight-guest-id";
const GUEST_COOKIE_NAME = "plansight_guest_id";
const GUEST_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365 * 2;

function generateGuestId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `guest-${crypto.randomUUID()}`;
  }

  return `guest-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function writeGuestCookie(guestId: string) {
  const cookieParts = [
    `${GUEST_COOKIE_NAME}=${encodeURIComponent(guestId)}`,
    "path=/",
    `max-age=${GUEST_COOKIE_MAX_AGE_SECONDS}`,
    "samesite=lax"
  ];

  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    cookieParts.push("secure");
  }

  document.cookie = cookieParts.join("; ");
}

export function getOrCreateGuestId() {
  if (typeof window === "undefined") {
    return null;
  }

  const fromStorage = window.localStorage.getItem(GUEST_ID_KEY);
  if (fromStorage) {
    writeGuestCookie(fromStorage);
    return fromStorage;
  }

  const fromCookie = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${GUEST_COOKIE_NAME}=`))
    ?.split("=")[1];

  if (fromCookie) {
    const decoded = decodeURIComponent(fromCookie);
    window.localStorage.setItem(GUEST_ID_KEY, decoded);
    return decoded;
  }

  const guestId = generateGuestId();
  window.localStorage.setItem(GUEST_ID_KEY, guestId);
  writeGuestCookie(guestId);
  return guestId;
}

export function getGuestPlanExpiryIso(days = 30) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}
