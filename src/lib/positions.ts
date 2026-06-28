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

export type CustomFieldType = "text" | "textarea" | "url" | "number" | "select" | "file";

export type CustomField = {
  key: string;
  label: string;
  type: CustomFieldType;
  placeholder?: string;
  required?: boolean;
  options?: string[]; // for select
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

// Prebuilt default questions per department (matched by lowercased name)
export const DEPARTMENT_DEFAULTS: Record<string, CustomField[]> = {
  finance: [
    { key: "fin_qualification", label: "Highest accounting qualification (CA, ACCA, CMA, MBA…)", type: "text", required: true },
    { key: "fin_software", label: "Accounting software you use (Tally, QuickBooks, SAP…)", type: "text", required: true },
    { key: "fin_years", label: "Years of finance/accounting experience", type: "number", required: true },
  ],
  "human resources": [
    { key: "hr_specialty", label: "HR specialty (recruiting, L&D, ops, generalist…)", type: "text", required: true },
    { key: "hr_team_size", label: "Largest team size you've supported", type: "number" },
    { key: "hr_tools", label: "HR tools you've used (BambooHR, Workday, etc.)", type: "text" },
  ],
  marketing: [
    { key: "mk_specialty", label: "Specialty (SEO, paid ads, content, growth…)", type: "text", required: true },
    { key: "mk_result", label: "A campaign result you're proud of", type: "textarea", required: true },
    { key: "mk_portfolio", label: "Portfolio / case study URL", type: "url" },
  ],
  operations: [
    { key: "ops_scope", label: "Operations scope you've handled", type: "textarea", required: true },
    { key: "ops_tools", label: "Tools you use (Notion, Asana, ERP…)", type: "text" },
    { key: "ops_years", label: "Years of ops experience", type: "number", required: true },
  ],
  product: [
    { key: "pr_scope", label: "Products you've shipped (links if possible)", type: "textarea", required: true },
    { key: "pr_methods", label: "Frameworks you use (JTBD, RICE, OKRs…)", type: "text" },
    { key: "pr_years", label: "Years in product", type: "number", required: true },
  ],
  sales: [
    { key: "sl_segment", label: "Segment you've sold to (B2B SMB, Enterprise, D2C…)", type: "text", required: true },
    { key: "sl_quota", label: "Last annual quota & attainment", type: "text", required: true },
    { key: "sl_years", label: "Years in sales", type: "number", required: true },
  ],
  engineering: [
    { key: "eng_github", label: "GitHub URL", type: "url", required: true },
    { key: "eng_stack", label: "Primary stack", type: "text", required: true },
    { key: "eng_years", label: "Years of engineering experience", type: "number", required: true },
  ],
  design: [
    { key: "ds_portfolio", label: "Portfolio URL (Dribbble/Behance/site)", type: "url", required: true },
    { key: "ds_tools", label: "Tools (Figma, Adobe CC…)", type: "text", required: true },
    { key: "ds_years", label: "Years of design experience", type: "number", required: true },
  ],
};

export function getDepartmentDefaults(name: string): CustomField[] {
  return DEPARTMENT_DEFAULTS[name.trim().toLowerCase()] ?? [];
}

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

// Office locations — admins pick one when creating a job
export const OFFICES = [
  "Dhaka — Head Office",
  "Dhaka — Creative Team Office",
  "Dhaka — Customer Support Office",
  "Remote",
] as const;
