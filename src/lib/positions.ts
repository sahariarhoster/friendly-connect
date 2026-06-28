export type PositionType =
  | "video_editor"
  | "social_media_manager"
  | "graphic_designer"
  | "content_writer"
  | "developer"
  | "marketing"
  | "other";

export const POSITION_LABELS: Record<PositionType, string> = {
  video_editor: "Video Editor",
  social_media_manager: "Social Media Manager",
  graphic_designer: "Graphic Designer",
  content_writer: "Content Writer",
  developer: "Developer",
  marketing: "Marketing",
  other: "Other",
};

export type CustomField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "url" | "number";
  placeholder?: string;
  required?: boolean;
};

export const CUSTOM_FIELDS: Record<PositionType, CustomField[]> = {
  video_editor: [
    { key: "showreel_url", label: "Showreel URL", type: "url", placeholder: "https://...", required: true },
    { key: "software", label: "Software you use (Premiere, DaVinci, etc.)", type: "text", required: true },
    { key: "years_experience", label: "Years of editing experience", type: "number", required: true },
  ],
  social_media_manager: [
    { key: "handles", label: "Social handles you manage", type: "textarea", placeholder: "@brand1 (50k), @brand2 (10k)…", required: true },
    { key: "best_campaign", label: "Best campaign — link or short description", type: "textarea", required: true },
    { key: "platforms", label: "Platforms (IG, TikTok, FB…)", type: "text", required: true },
  ],
  graphic_designer: [
    { key: "portfolio_url", label: "Portfolio URL (Behance/Dribbble)", type: "url", required: true },
    { key: "tools", label: "Tools (Photoshop, Illustrator, Figma…)", type: "text", required: true },
  ],
  content_writer: [
    { key: "sample_url", label: "Writing sample URL", type: "url", required: true },
    { key: "niches", label: "Niches you write for", type: "text", required: true },
  ],
  developer: [
    { key: "github_url", label: "GitHub URL", type: "url", required: true },
    { key: "stack", label: "Primary stack", type: "text", required: true },
    { key: "years_experience", label: "Years of experience", type: "number", required: true },
  ],
  marketing: [
    { key: "specialty", label: "Specialty (SEO, paid ads, growth…)", type: "text", required: true },
    { key: "results", label: "A result you're proud of", type: "textarea", required: true },
  ],
  other: [],
};

export const APPLICATION_STATUSES = [
  "pending",
  "reviewing",
  "shortlisted",
  "interviewed",
  "rejected",
  "hired",
] as const;

export const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  reviewing: "Reviewing",
  shortlisted: "Shortlisted",
  interviewed: "Interviewed",
  rejected: "Rejected",
  hired: "Hired",
};

export const DEPARTMENTS = [
  "Engineering",
  "Design",
  "Marketing",
  "Content",
  "Social Media",
  "Video Production",
  "Sales",
  "Operations",
  "Human Resources",
  "Finance",
  "Customer Support",
] as const;

