export const USTAZ_CAN_DELETE_OWN_REPORT = false;
export const PHOTO_BUCKET = "student-photos";
export const PHOTO_MAX_BYTES = 2 * 1024 * 1024;
export const PHOTO_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const CATEGORIES = ["ringan", "sedang", "berat"] as const;
export type Category = (typeof CATEGORIES)[number];
