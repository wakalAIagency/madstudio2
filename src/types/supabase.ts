export type UserRole = "admin" | "viewer";
export type AvailabilityRuleType = "weekly" | "exception";
export type SlotStatus = "available" | "requested" | "approved" | "blocked";
export type BookingStatus = "pending" | "approved" | "declined" | "canceled";
export type SlotCreatedVia = "rule" | "manual";

type Timestamp = string;
type UUID = string;

export type Database = {
  public: {
    Tables: {
      studios: {
        Row: {
          id: UUID;
          name: string;
          slug: string;
          description: string | null;
          created_at: Timestamp;
        };
        Insert: {
          id?: UUID;
          name: string;
          slug: string;
          description?: string | null;
          created_at?: Timestamp;
        };
        Update: {
          id?: UUID;
          name?: string;
          slug?: string;
          description?: string | null;
          created_at?: Timestamp;
        };
      };
      users: {
        Row: {
          id: UUID;
          email: string;
          password_hash: string;
          role: UserRole;
          created_at: Timestamp;
        };
        Insert: {
          id?: UUID;
          email: string;
          password_hash: string;
          role?: UserRole;
          created_at?: Timestamp;
        };
        Update: {
          id?: UUID;
          email?: string;
          password_hash?: string;
          role?: UserRole;
          created_at?: Timestamp;
        };
      };
      availability_rules: {
        Row: {
          id: UUID;
          rule_type: AvailabilityRuleType;
          weekday: number | null;
          start_time: string;
          end_time: string;
          date: string | null;
          is_open: boolean;
          studio_id: UUID;
          created_by: UUID | null;
          created_at: Timestamp;
        };
        Insert: {
          id?: UUID;
          rule_type: AvailabilityRuleType;
          weekday?: number | null;
          start_time: string;
          end_time: string;
          date?: string | null;
          is_open?: boolean;
          studio_id: UUID;
          created_by?: UUID | null;
          created_at?: Timestamp;
        };
        Update: {
          id?: UUID;
          rule_type?: AvailabilityRuleType;
          weekday?: number | null;
          start_time?: string;
          end_time?: string;
          date?: string | null;
          is_open?: boolean;
          studio_id?: UUID;
          created_by?: UUID | null;
          created_at?: Timestamp;
        };
      };
      slots: {
        Row: {
          id: UUID;
          start_at: Timestamp;
          end_at: Timestamp;
          status: SlotStatus;
          hold_expires_at: Timestamp | null;
          created_via: SlotCreatedVia;
          studio_id: UUID;
        };
        Insert: {
          id?: UUID;
          start_at: Timestamp;
          end_at: Timestamp;
          status?: SlotStatus;
          hold_expires_at?: Timestamp | null;
          created_via?: SlotCreatedVia;
          studio_id: UUID;
        };
        Update: {
          id?: UUID;
          start_at?: Timestamp;
          end_at?: Timestamp;
          status?: SlotStatus;
          hold_expires_at?: Timestamp | null;
          created_via?: SlotCreatedVia;
          studio_id?: UUID;
        };
      };
      bookings: {
        Row: {
          id: UUID;
          slot_id: UUID;
          visitor_name: string;
          visitor_email: string;
          visitor_phone: string;
          notes: string | null;
          status: BookingStatus;
          token: string;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: UUID;
          slot_id: UUID;
          visitor_name: string;
          visitor_email: string;
          visitor_phone: string;
          notes?: string | null;
          status?: BookingStatus;
          token?: string;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: {
          id?: UUID;
          slot_id?: UUID;
          visitor_name?: string;
          visitor_email?: string;
          visitor_phone?: string;
          notes?: string | null;
          status?: BookingStatus;
          token?: string;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
      };
      audit_logs: {
        Row: {
          id: UUID;
          actor_id: UUID | null;
          action: string;
          metadata: Record<string, unknown> | null;
          created_at: Timestamp;
        };
        Insert: {
          id?: UUID;
          actor_id?: UUID | null;
          action: string;
          metadata?: Record<string, unknown> | null;
          created_at?: Timestamp;
        };
        Update: {
          id?: UUID;
          actor_id?: UUID | null;
          action?: string;
          metadata?: Record<string, unknown> | null;
          created_at?: Timestamp;
        };
      };
      studio_images: {
        Row: {
          id: UUID;
          studio_id: UUID;
          image_url: string;
          caption: string | null;
          sort_order: number;
          created_at: Timestamp;
        };
        Insert: {
          id?: UUID;
          studio_id: UUID;
          image_url: string;
          caption?: string | null;
          sort_order?: number;
          created_at?: Timestamp;
        };
        Update: {
          id?: UUID;
          studio_id?: UUID;
          image_url?: string;
          caption?: string | null;
          sort_order?: number;
          created_at?: Timestamp;
        };
      };
    };
    Functions: {
      count_bookings_today: {
        Args: { studio?: UUID | null };
        Returns: number;
      };
      count_bookings_this_week: {
        Args: { studio?: UUID | null };
        Returns: number;
      };
    };
    Enums: {
      user_role: UserRole;
      availability_rule_type: AvailabilityRuleType;
      slot_status: SlotStatus;
      booking_status: BookingStatus;
      slot_created_via: SlotCreatedVia;
    };
    Views: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
