import { z } from "zod";
import { PHOTO_MAX_BYTES, PHOTO_MIME_TYPES } from "@/lib/constants";

const mime = z.enum(PHOTO_MIME_TYPES);
export const photoMetadataSchema = z.object({ name: z.string().min(1), type: mime, size: z.number().int().positive().max(PHOTO_MAX_BYTES, "Ukuran foto maksimal 2 MB") }).superRefine((file, context) => {
  const extension = file.name.toLowerCase().split(".").pop();
  const valid = (file.type === "image/jpeg" && ["jpg", "jpeg"].includes(extension ?? "")) || (file.type === "image/png" && extension === "png") || (file.type === "image/webp" && extension === "webp");
  if (!valid) context.addIssue({ code: "custom", message: "Ekstensi file tidak cocok dengan format foto" });
});
