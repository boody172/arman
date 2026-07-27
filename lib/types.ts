export type BusinessType = "restaurant" | "cafe" | "shop" | "service" | "other";

export interface Brand {
  id: string;
  name: string;
  businessType: BusinessType;
  ownerEmail: string;
  notifyEmail: string;
  twilioPhoneNumber: string;
  menuText: string;
  instagramUrl: string;
  facebookUrl: string;
  websiteUrl: string;
  extraNotes: string;
  greeting: string;
  voiceId: string;
  knowledgeText: string;
  createdAt: string;
  updatedAt: string;
}

export type BrandInput = Omit<
  Brand,
  "id" | "knowledgeText" | "createdAt" | "updatedAt"
>;

export interface ConversationMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CallSession {
  callSid: string;
  brandId: string;
  callerPhone: string;
  history: ConversationMessage[];
  turns: number;
  status: "active" | "completed" | "abandoned";
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = "new" | "notified" | "failed";

export interface Order {
  id: string;
  brandId: string;
  callSid: string;
  callerPhone: string;
  summary: string;
  items: string[];
  status: OrderStatus;
  createdAt: string;
}
