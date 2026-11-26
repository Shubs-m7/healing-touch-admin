export interface PainCategory {
  id: string;
  name: string;
  conditions: string[];
}

export const painCategories: Record<string, PainCategory> = {
  neck: {
    id: "neck",
    name: "Neck",
    conditions: [
      "Spasm",
      "Trigger point",
      "Radiculopathy",
      "Posture-related issues",
      "Tingling / Numbness",
      "Other",
    ],
  },
  shoulder: {
    id: "shoulder",
    name: "Shoulder",
    conditions: [
      "Decreased mobility",
      "Frozen shoulder (Adhesive capsulitis)",
      "Tendinitis",
      "Impingement syndrome",
      "Fracture",
      "Tingling",
      "Other",
    ],
  },
  elbow: {
    id: "elbow",
    name: "Elbow",
    conditions: [
      "Tennis elbow (Lateral epicondylitis)",
      "Golfer's elbow (Medial epicondylitis)",
      "Decreased mobility",
      "Student's elbow (Olecranon bursitis)",
      "Tingling",
      "Other",
    ],
  },
  wrist: {
    id: "wrist",
    name: "Wrist",
    conditions: [
      "CTS (Carpal Tunnel Syndrome)",
      "Tingling / Numbness",
      "Pain in fingers",
      "R/A pain (likely Repetitive Activity pain)",
      "Other",
    ],
  },
  hip: {
    id: "hip",
    name: "Hip",
    conditions: [
      "Replacement",
      "Pain",
      "Laxity",
      "Immobility",
      "Incontinence",
      "Sciatica",
      "Other",
    ],
  },
  glute: {
    id: "glute",
    name: "Glutes / Buttocks",
    conditions: [
      "Piriformis syndrome",
      "Deep gluteal syndrome / Sciatica",
      "Gluteal tendinopathy",
      "Gluteus medius / minimus strain",
      "Sacroiliac joint pain",
      "Buttock muscle spasms",
      "Other",
    ],
  },
  knee: {
    id: "knee",
    name: "Knee",
    conditions: [
      "Replacement",
      "Pain / OA (Osteoarthritis)",
      "Ligament injury",
      "Shin pain",
      "Patellofemoral pain",
      "Patellar immobility",
      "Other",
    ],
  },
  back: {
    id: "back",
    name: "Upper Back",
    conditions: [
      "Upper back tension",
      "Scapular & Rhomboid pain",
      "Trapezius muscle spasm",
      "Interscapular pain",
      "Muscle strain",
      "Other",
    ],
  },
  mid_back: {
    id: "mid_back",
    name: "Mid Back",
    conditions: [
      "Mid back pain & stiffness",
      "Thoracic dorsal strain",
      "Rib cage attachment pain",
      "Postural fatigue",
      "Breathing-associated mid-back pain",
      "Other",
    ],
  },
  spine: {
    id: "spine",
    name: "Spine & Vertebral Column",
    conditions: [
      "Herniated disc",
      "Sciatica",
      "Spinal stenosis",
      "Scoliosis",
      "Vertebral pain",
      "Postural misalignment",
      "Other",
    ],
  },
  waist: {
    id: "waist",
    name: "Lower Back & Waist",
    conditions: [
      "Lower back pain (L1-L5)",
      "Lumbar muscle strain",
      "Waist stiffness",
      "Loin tension & flank pain",
      "Sacroiliac joint pain",
      "Other",
    ],
  },
  chest: {
    id: "chest",
    name: "Chest",
    conditions: [
      "Pain when breathing",
      "Muscle strain",
      "Costochondritis",
      "Tightness",
      "Other",
    ],
  },
  abdomen: {
    id: "abdomen",
    name: "Abdomen",
    conditions: [
      "Abdominal pain",
      "Muscle strain",
      "Cramps",
      "Digestive issues",
      "Weakness",
      "Other",
    ],
  },
  ankle: {
    id: "ankle",
    name: "Ankle",
    conditions: [
      "Sprain",
      "Achilles tendinitis",
      "Plantar fasciitis",
      "Fracture",
      "Instability",
      "Other",
    ],
  },
  biceps: {
    id: "biceps",
    name: "Biceps",
    conditions: [
      "Strain",
      "Tendonitis",
      "Rupture",
      "Pain",
      "Other",
    ],
  },
  forearm: {
    id: "forearm",
    name: "Forearm",
    conditions: [
      "Strain",
      "Pain",
      "Tightness",
      "Numbsess",
      "Other",
    ],
  },
  hand: {
    id: "hand",
    name: "Hand",
    conditions: [
      "Arthritis",
      "Carpal Tunnel",
      "Trigger Finger",
      "Pain",
      "Numbness",
      "Other",
    ],
  },
  thigh: {
    id: "thigh",
    name: "Thigh",
    conditions: [
      "Strain",
      "Bruise",
      "Pain",
      "Weakness",
      "Other",
    ],
  },
  shin: {
    id: "shin",
    name: "Shin",
    conditions: [
      "Shin splints (MTSS)",
      "Tibialis anterior strain / tendonitis",
      "Stress fracture / reaction",
      "Anterior compartment pain",
      "Pain along tibia bone",
      "Other",
    ],
  },
  calf: {
    id: "calf",
    name: "Calf",
    conditions: [
      "Gastrocnemius muscle strain / tear",
      "Soleus strain / tightness",
      "Calf cramps & spasms",
      "Achilles tendon attachment pain",
      "Exertional lower leg tightness",
      "Other",
    ],
  },
  foot: {
    id: "foot",
    name: "Foot",
    conditions: [
      "Plantar Fasciitis",
      "Bunions",
      "Pain",
      "Numbness",
      "Other",
    ],
  },
};

export type BodyPartId = keyof typeof painCategories;
