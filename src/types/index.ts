export type BookingStatus = "pending" | "approved" | "declined" | "canceled";
export type SlotStatus = "available" | "requested" | "approved" | "blocked";
export type AvailabilityRuleType = "weekly" | "exception";

export interface Slot {
  id: string;
  start_at: string;
  end_at: string;
  status: SlotStatus;
  hold_expires_at: string | null;
  created_via: "rule" | "manual";
  studio_id: string;
}

export interface Booking {
  id: string;
  slot_id: string;
  visitor_name: string;
  visitor_email: string;
  visitor_phone: string;
  notes: string | null;
  status: BookingStatus;
  token: string;
  created_at: string;
  updated_at: string;
  slot?: Slot;
}

export interface AvailabilityRule {
  id: string;
  rule_type: AvailabilityRuleType;
  weekday: number | null;
  start_time: string;
  end_time: string;
  date: string | null;
  is_open: boolean;
  created_by: string | null;
  created_at: string;
  studio_id: string;
}

export interface AuditLogEntry {
  id: string;
  actor_id: string | null;
  action: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface Studio {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  images?: StudioImage[];
}

export interface StudioImage {
  id: string;
  studio_id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
}
