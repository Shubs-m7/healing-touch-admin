const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://adaptus.in";
export const SITE_URL = rawSiteUrl.endsWith("/") ? rawSiteUrl.slice(0, -1) : rawSiteUrl;

export const SITE_NAME = "Adaptus Physiotherapy & Health Care";
export const SITE_SHORT_NAME = "Adaptus Clinic";
export const SITE_DESCRIPTION =
  "Expert physiotherapy, 1-on-1 manual therapy, sports & orthopedic rehabilitation, posture correction, and electro-physiotherapy in Pune. Book in-clinic, home visit, or online consultations.";

export const SITE_KEYWORDS = [
  "physiotherapy clinic",
  "physiotherapist in Pune",
  "manual therapy",
  "sports injury rehabilitation",
  "orthopedic physiotherapy",
  "post-surgical rehabilitation",
  "posture correction",
  "joint mobility therapy",
  "spine rehabilitation",
  "home visit physiotherapy",
  "Adaptus Physiotherapy",
];

export const NOINDEX_ROBOTS = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: {
    index: false,
    follow: false,
    noimageindex: true,
  },
} as const;
