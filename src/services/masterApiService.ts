let rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
if (rawApiUrl.endsWith("/")) {
  rawApiUrl = rawApiUrl.slice(0, -1);
}
if (!rawApiUrl.endsWith("/api")) {
  rawApiUrl = `${rawApiUrl}/api`;
}
const API_URL = rawApiUrl;

export interface TrustBadgeItem {
  icon: string;
  label: string;
}

export interface CareServiceItem {
  title: string;
  description: string;
  icon: string;
  color: string;
}

export interface LandingPageContent {
  hero: {
    badge: string;
    headline: string;
    headlineHighlight: string;
    subheadline: string;
    primaryCtaText: string;
    secondaryCtaText: string;
    variant?: "aurora-v2" | "classic";
    specialties?: string[];
  };
  trustBadges: TrustBadgeItem[];
  services: CareServiceItem[];
  cta: {
    title: string;
    description: string;
    buttonText: string;
  };
  contactInfo: {
    clinicName: string;
    phone: string;
    email: string;
    address: string;
    workingHours: string;
  };
}

export interface StatItem {
  value: string;
  label: string;
}

export interface PhilosophyPillar {
  icon: string;
  title: string;
  description: string;
}

export interface SpecialistItem {
  name: string;
  role: string;
  specialty: string;
  experience: string;
}

export interface AboutPageContent {
  hero: {
    title: string;
    titleHighlight: string;
    description: string;
  };
  mission: {
    badge: string;
    title: string;
    description: string;
    points: string[];
  };
  stats: StatItem[];
  philosophy: {
    title: string;
    description: string;
    pillars: PhilosophyPillar[];
  };
  specialists: SpecialistItem[];
}

export interface SiteContentData {
  landingPage: LandingPageContent;
  aboutPage: AboutPageContent;
  updatedAt?: string;
}

export interface BaseRates {
  inClinicSession: number;
  homeVisitSession: number;
  onlineSession: number;
  initialConsultation: number;
}

export interface PackageMasterItem {
  id: string;
  title: string;
  badge: string;
  sessions: number;
  pricePerSession: number;
  totalPrice: number;
  originalPricePerSession?: number;
  originalTotalPrice?: number;
  discountPercent?: number;
  homeVisitPricePerSession?: number;
  homeVisitTotalPrice?: number;
  originalHomeVisitPricePerSession?: number;
  originalHomeVisitTotalPrice?: number;
  description: string;
  features: string[];
  recommended: boolean;
  isActive: boolean;
}

export interface PricingMasterData {
  baseRates: BaseRates;
  packages: PackageMasterItem[];
  updatedAt?: string;
}

// Fallback site content
export const defaultSiteContent: SiteContentData = {
  landingPage: {
    hero: {
      badge: "Move. Adapt. Thrive.",
      headline: "Personalized Physiotherapy Care for",
      headlineHighlight: "Pain-Free Living",
      subheadline:
        "Our expert team provides comprehensive pain diagnosis and personalized recovery plans to help you regain mobility and live life without limitations.",
      primaryCtaText: "Book Appointment",
      secondaryCtaText: "Know More About Us",
      variant: "aurora-v2",
      specialties: [
        "Spine & Lower Back",
        "Neck & Cervical",
        "Knee & Joints",
        "Sports Injury Rehab",
        "Post-Op Recovery",
      ],
    },
    trustBadges: [
      { icon: "Shield", label: "Licensed Experts" },
      { icon: "Award", label: "Award Winning" },
      { icon: "Heart", label: "100+ Patients" },
      { icon: "Clock", label: "Same Day Booking" },
    ],
    services: [
      {
        title: "Pain Management",
        description: "Advanced techniques to diagnose and treat chronic and acute pain conditions.",
        icon: "Activity",
        color: "from-primary/20 to-primary/5",
      },
      {
        title: "Sports Rehabilitation",
        description: "Get back in the game with specialized sports injury recovery programs.",
        icon: "Dumbbell",
        color: "from-secondary/20 to-secondary/5",
      },
      {
        title: "Post-Surgery Recovery",
        description: "Comprehensive rehabilitation programs for optimal surgical outcomes.",
        icon: "Stethoscope",
        color: "from-accent/20 to-accent/5",
      },
      {
        title: "Posture Correction",
        description: "Improve your posture and prevent long-term musculoskeletal issues.",
        icon: "UserCheck",
        color: "from-aurora-pink/20 to-aurora-pink/5",
      },
      {
        title: "Manual Therapy",
        description: "Hands-on techniques to improve mobility and reduce pain.",
        icon: "HelpingHand",
        color: "from-aurora-green/20 to-aurora-green/5",
      },
      {
        title: "Preventive Care",
        description: "Proactive treatments to maintain health and prevent injuries.",
        icon: "ShieldCheck",
        color: "from-aurora-blue/20 to-aurora-blue/5",
      },
    ],
    cta: {
      title: "Ready to Start Your Recovery Journey?",
      description:
        "Take the first step towards a pain-free life. Book your consultation today and let our experts create a personalized treatment plan for you.",
      buttonText: "Schedule Your Appointment",
    },
    contactInfo: {
      clinicName: "Adaptus Physiotherapy Clinic",
      phone: "+91 98765 43210",
      email: "contact@adaptus.in",
      address: "Shop 4, Health Haven Complex, Pune, Maharashtra",
      workingHours: "Mon - Sat: 9:00 AM - 8:00 PM",
    },
  },
  aboutPage: {
    hero: {
      title: "About",
      titleHighlight: "Adaptus",
      description:
        "Dedicated to transforming lives through expert physiotherapy care and evidence-based treatment approaches.",
    },
    mission: {
      badge: "Our Mission",
      title: "Empowering You to Live Without Pain",
      description:
        "At Adaptus, we believe that everyone deserves to live a life free from physical limitations. Our mission is to provide accessible, personalized, and effective physiotherapy care that helps you achieve your health goals.",
      points: [
        "Patient-centered care approach",
        "Evidence-based treatment protocols",
        "Continuous progress monitoring",
        "Holistic wellness focus",
      ],
    },
    stats: [
      { value: "10+", label: "Years Experience" },
      { value: "5000+", label: "Happy Patients" },
      { value: "98%", label: "Success Rate" },
      { value: "15+", label: "Expert Therapists" },
    ],
    philosophy: {
      title: "Our Philosophy",
      description:
        "We combine modern medical science with compassionate care to deliver treatments that truly make a difference.",
      pillars: [
        {
          icon: "Heart",
          title: "Compassionate Care",
          description:
            "We treat every patient with empathy, understanding that healing is both physical and emotional.",
        },
        {
          icon: "BookOpen",
          title: "Evidence-Based",
          description:
            "All our treatments are backed by the latest research and clinical best practices.",
        },
        {
          icon: "Users",
          title: "Collaborative Approach",
          description:
            "We work with you to create personalized treatment plans that fit your lifestyle.",
        },
      ],
    },
    specialists: [
      {
        name: "Dr. Sarah Mitchell",
        role: "Lead Physiotherapist",
        specialty: "Sports & Orthopedic Rehabilitation",
        experience: "12 years",
      },
      {
        name: "Dr. James Chen",
        role: "Senior Therapist",
        specialty: "Neurological Physiotherapy",
        experience: "10 years",
      },
      {
        name: "Dr. Emily Rodriguez",
        role: "Specialist",
        specialty: "Pediatric & Women's Health",
        experience: "8 years",
      },
    ],
  },
};

// Fallback pricing data
export const defaultPricingMaster: PricingMasterData = {
  baseRates: {
    inClinicSession: 700,
    homeVisitSession: 1000,
    onlineSession: 600,
    initialConsultation: 750,
  },
  packages: [
    {
      id: "per_session",
      title: "Per Session",
      badge: "Flexible Pay-As-You-Go",
      sessions: 1,
      pricePerSession: 700,
      totalPrice: 700,
      homeVisitPricePerSession: 1000,
      homeVisitTotalPrice: 1000,
      description: "Pay standard charge per visit without package commitments.",
      features: [
        "Single 45-min targeted therapy session",
        "Direct therapist consultation",
        "Custom exercise prescription",
      ],
      recommended: false,
      isActive: true,
    },
    {
      id: "6_sessions",
      title: "6 Sessions Package",
      badge: "Mild to Moderate Relief",
      sessions: 6,
      pricePerSession: 700,
      totalPrice: 4200,
      homeVisitPricePerSession: 1000,
      homeVisitTotalPrice: 6000,
      description: "Ideal for acute sprains, postural strains, and targeted mobility restoration.",
      features: [
        "6 Comprehensive treatment sessions",
        "Periodic progress re-evaluation",
        "Home exercise regimen monitoring",
      ],
      recommended: true,
      isActive: true,
    },
    {
      id: "10_sessions",
      title: "10 Sessions Package",
      badge: "Most Popular Rehab",
      sessions: 10,
      pricePerSession: 700,
      totalPrice: 7000,
      homeVisitPricePerSession: 1000,
      homeVisitTotalPrice: 10000,
      description: "Designed for chronic back/neck pain, joint rehabilitation & post-surgery recovery.",
      features: [
        "10 Structured rehabilitation sessions",
        "Strengthening & ergonomics protocol",
        "Direct therapist chat support",
      ],
      recommended: false,
      isActive: true,
    },
    {
      id: "15_sessions",
      title: "15 Sessions Package",
      badge: "Complete Recovery Care",
      sessions: 15,
      pricePerSession: 630,
      totalPrice: 9450,
      originalPricePerSession: 700,
      originalTotalPrice: 10500,
      discountPercent: 10,
      homeVisitPricePerSession: 900,
      homeVisitTotalPrice: 13500,
      originalHomeVisitPricePerSession: 1000,
      originalHomeVisitTotalPrice: 15000,
      description: "Intensive holistic rehabilitation protocol for long-term musculoskeletal wellness.",
      features: [
        "15 Full rehabilitation sessions",
        "Advanced biomechanical retraining",
        "Full wellness & fitness roadmap",
      ],
      recommended: false,
      isActive: true,
    },
  ],
};

// ================= API Functions ================= //

const getAdminAuthHeaders = (includeContentType = false): HeadersInit => {
  const headers: Record<string, string> = {};
  if (includeContentType) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
};

export const getSiteContent = async (): Promise<SiteContentData> => {
  try {
    const res = await fetch(`${API_URL}/content`, {
        credentials: "include",
      method: "GET",
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch site content");
    const data = await res.json();
    return data.content || defaultSiteContent;
  } catch (err) {
    console.warn("Using fallback default site content:", err);
    return defaultSiteContent;
  }
};

export const updateSiteContent = async (
  payload: Partial<SiteContentData>
): Promise<SiteContentData> => {
  const res = await fetch(`${API_URL}/content`, {
        credentials: "include",
    method: "PUT",
    headers: getAdminAuthHeaders(true),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to update site content");
  }
  const data = await res.json();
  return data.content;
};

export const resetSiteContent = async (): Promise<SiteContentData> => {
  const res = await fetch(`${API_URL}/content/reset`, {
        credentials: "include",
    method: "POST",
    headers: getAdminAuthHeaders(false),
  });
  if (!res.ok) throw new Error("Failed to reset site content");
  const data = await res.json();
  return data.content || defaultSiteContent;
};

export const getPricingMaster = async (): Promise<PricingMasterData> => {
  try {
    const res = await fetch(`${API_URL}/pricing`, {
        credentials: "include",
      method: "GET",
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch pricing master");
    const data = await res.json();
    return data.pricing || defaultPricingMaster;
  } catch (err) {
    console.warn("Using fallback default pricing master:", err);
    return defaultPricingMaster;
  }
};

export const updatePricingMaster = async (
  payload: Partial<PricingMasterData>
): Promise<PricingMasterData> => {
  const res = await fetch(`${API_URL}/pricing`, {
        credentials: "include",
    method: "PUT",
    headers: getAdminAuthHeaders(true),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to update pricing master");
  }
  const data = await res.json();
  return data.pricing;
};

export const resetPricingMaster = async (): Promise<PricingMasterData> => {
  const res = await fetch(`${API_URL}/pricing/reset`, {
        credentials: "include",
    method: "POST",
    headers: getAdminAuthHeaders(false),
  });
  if (!res.ok) throw new Error("Failed to reset pricing master");
  const data = await res.json();
  return data.pricing || defaultPricingMaster;
};

// ================= Theme & Branding Master ================= //

export interface ThemeColors {
  primary: string;
  primaryHsl: string;
  primaryForeground: string;
  secondary: string;
  secondaryHsl: string;
  secondaryForeground: string;
  accent: string;
  accentHsl: string;
  background: string;
  backgroundHsl: string;
  cardBackground: string;
  cardBackgroundHsl: string;
  foreground: string;
  foregroundHsl: string;
  ring: string;
  ringHsl: string;
}

export interface ThemeTypography {
  headingFont: string;
  bodyFont: string;
  fontScale: "compact" | "normal" | "large";
  customHeadingFont?: string;
  customBodyFont?: string;
  customFontUrl?: string;
}

export interface ThemeStyling {
  borderRadius: string;
  radiusValue: string;
  buttonStyle: "pill" | "curved" | "sharp";
  shadowIntensity: "soft" | "medium" | "glow" | "minimal";
  heroGradient: "aurora" | "subtle" | "vibrant" | "minimal";
  auroraColors?: string[];
}

export interface ThemeBranding {
  clinicDisplayName: string;
  tagline: string;
  logoUrl?: string;
  logoTextHighlight?: string;
}

export interface ThemeMasterData {
  key?: string;
  activePreset: string;
  colors: ThemeColors;
  typography: ThemeTypography;
  styling: ThemeStyling;
  branding: ThemeBranding;
  updatedAt?: string;
}

export const defaultThemeMaster: ThemeMasterData = {
  activePreset: "emerald-sage",
  colors: {
    primary: "#10b981",
    primaryHsl: "150 45% 52%",
    primaryForeground: "#ffffff",
    secondary: "#0ea5e9",
    secondaryHsl: "200 75% 60%",
    secondaryForeground: "#ffffff",
    accent: "#059669",
    accentHsl: "158 60% 50%",
    background: "#f6fbf8",
    backgroundHsl: "150 35% 97%",
    cardBackground: "#ffffff",
    cardBackgroundHsl: "0 0% 100%",
    foreground: "#0f172a",
    foregroundHsl: "230 20% 15%",
    ring: "#0ea5e9",
    ringHsl: "200 75% 60%",
  },
  typography: {
    headingFont: "Plus Jakarta Sans",
    bodyFont: "Inter",
    fontScale: "normal",
    customHeadingFont: "",
    customBodyFont: "",
    customFontUrl: "",
  },
  styling: {
    borderRadius: "rounded-2xl",
    radiusValue: "1.25rem",
    buttonStyle: "curved",
    shadowIntensity: "soft",
    heroGradient: "aurora",
    auroraColors: ["#036137", "#05dcc1", "#00fa87", "#126e45"],
  },
  branding: {
    clinicDisplayName: "Adaptus Physiotherapy & Health Care",
    tagline: "Advanced Healing & Rehabilitation Clinic",
    logoUrl: "",
    logoTextHighlight: "Physiotherapy",
  },
};

export function hexToHsl(hex: string): string {
  let c = hex.replace("#", "");
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  if (c.length !== 6) return "150 45% 52%";
  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export const getThemeMaster = async (): Promise<ThemeMasterData> => {
  try {
    const res = await fetch(`${API_URL}/theme`, {
        credentials: "include",
      method: "GET",
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch theme master");
    const data = await res.json();
    return data.theme || defaultThemeMaster;
  } catch (err) {
    console.warn("Using fallback default theme master:", err);
    return defaultThemeMaster;
  }
};

export const updateThemeMaster = async (
  payload: Partial<ThemeMasterData>
): Promise<ThemeMasterData> => {
  const res = await fetch(`${API_URL}/theme`, {
        credentials: "include",
    method: "PUT",
    headers: getAdminAuthHeaders(true),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to update theme master");
  }
  const data = await res.json();
  return data.theme;
};

export const resetThemeMaster = async (): Promise<ThemeMasterData> => {
  const res = await fetch(`${API_URL}/theme/reset`, {
        credentials: "include",
    method: "POST",
    headers: getAdminAuthHeaders(false),
  });
  if (!res.ok) throw new Error("Failed to reset theme master");
  const data = await res.json();
  return data.theme || defaultThemeMaster;
};

/**
 * Strips HTML <link ...>, CSS @import url(...), quotes, and trailing semicolons
 * to isolate the clean web font URL.
 */
export function extractCleanFontUrl(rawInput: string): string {
  if (!rawInput) return "";
  let str = rawInput.trim();

  // If user pasted a block of HTML with multiple <link> tags (e.g. preconnect + css2 link)
  const allHrefs = [...str.matchAll(/href=["']([^"']+)["']/gi)];
  if (allHrefs.length > 0) {
    // Prefer the actual stylesheet href (family=, /css, .css, or font files) over preconnects
    const fontHref = allHrefs.find((m) =>
      m[1].includes("family=") ||
      m[1].includes("/css") ||
      m[1].endsWith(".css") ||
      /\.(woff2?|ttf|otf|eot)($|\?)/i.test(m[1])
    );
    if (fontHref && fontHref[1]) {
      str = fontHref[1];
    } else {
      str = allHrefs[allHrefs.length - 1][1];
    }
  } else {
    // If user pasted CSS @import url('...')
    const importMatch = str.match(/url\(["']?([^"')]+)["']?\)/i);
    if (importMatch && importMatch[1]) {
      str = importMatch[1];
    }
  }

  // Remove surrounding quotes, brackets, and trailing semicolons
  str = str.replace(/^[<"']|[>"'];?$/g, "").trim();
  return str;
}

/**
 * Extracts font family name(s) from a Google Fonts, Bunny Fonts, or web font URL.
 */
export function parseFontFamiliesFromUrl(rawUrl: string): string[] {
  const cleanUrl = extractCleanFontUrl(rawUrl);
  if (!cleanUrl) return [];

  const families: string[] = [];

  try {
    // Check if it's a URL
    const urlObj = new URL(cleanUrl.startsWith("http") ? cleanUrl : `https://${cleanUrl}`);

    // 1. Google Fonts / Bunny Fonts: family parameter(s)
    const searchParams = urlObj.searchParams;
    const allFamilies = searchParams.getAll("family");

    for (const fam of allFamilies) {
      // Split on colon (weights/styles): "Playfair+Display:ital,wght@..." -> "Playfair+Display"
      const rawName = fam.split(":")[0];
      const decoded = decodeURIComponent(rawName)
        .replace(/\+/g, " ")
        .replace(/[-_]/g, " ")
        .trim();

      // Title case if lowercased (like bunny fonts "albert-sans")
      const titleCased = decoded
        .split(" ")
        .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
        .join(" ");

      if (titleCased && !families.includes(titleCased)) {
        families.push(titleCased);
      }
    }

    // 2. Direct font files: e.g. https://.../MyCustomFont.woff2
    if (families.length === 0) {
      const pathname = urlObj.pathname;
      const matchFile = pathname.match(/\/([^\/?#]+)\.(woff2?|ttf|otf|eot)($|\?)/i);
      if (matchFile && matchFile[1]) {
        const cleanName = decodeURIComponent(matchFile[1])
          .replace(/[-_](regular|bold|light|italic|medium|semibold|black|thin|variablefont[a-z0-9_,]*)/gi, "")
          .replace(/[-_]/g, " ")
          .trim();
        const titleCased = cleanName
          .split(" ")
          .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
          .join(" ");
        if (titleCased) families.push(titleCased);
      }
    }
  } catch {
    // Regex fallback for loose strings like "family=Cinzel:wght@400"
    const matches = cleanUrl.matchAll(/family=([^&:#]+)/g);
    for (const m of matches) {
      const name = decodeURIComponent(m[1]).replace(/\+/g, " ").replace(/[-_]/g, " ").trim();
      const titleCased = name
        .split(" ")
        .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
        .join(" ");
      if (titleCased && !families.includes(titleCased)) {
        families.push(titleCased);
      }
    }
  }

  return families;
}

