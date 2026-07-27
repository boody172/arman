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
  /** What you charge this client per month, in EGP. Used for the profit/loss report. */
  monthlyFeeEgp: number;
  /** Flat Twilio number rental, in USD/month (not usage-based) — check your Twilio invoice. */
  twilioNumberMonthlyFeeUsd: number;
  createdAt: string;
  updatedAt: string;
}

export type BrandInput = Omit<Brand, "id" | "createdAt" | "updatedAt">;

export interface ConversationMessage {
  role: "system" | "user" | "assistant";
  content: string;
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
