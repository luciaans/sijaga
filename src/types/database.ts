export type UserRole = "admin" | "ustaz";
export type EducatorType = "ustadz" | "ustadzah";
export type Profile = { id: string; auth_user_id: string; full_name: string; username: string; role: UserRole; educator_type: EducatorType | null; is_active: boolean; deleted_at: string | null; created_at: string; updated_at: string };
export type Violation = { id: string; student_name: string; student_name_normalized: string; student_class: string; student_photo_url: string | null; category: "ringan" | "sedang" | "berat"; description: string; incident_date: string; reporter_id: string; created_at: string; updated_at: string; reporter?: Pick<Profile, "full_name" | "username"> };
