export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          auth0_subject: string;
          email: string;
          display_name: string;
          role: "admin" | "user";
          status: "active" | "soft_deleted";
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
          deleted_by: string | null;
        };
        Insert: {
          id?: string;
          auth0_subject: string;
          email: string;
          display_name: string;
          role?: "admin" | "user";
          status?: "active" | "soft_deleted";
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
        };
        Update: {
          id?: string;
          auth0_subject?: string;
          email?: string;
          display_name?: string;
          role?: "admin" | "user";
          status?: "active" | "soft_deleted";
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
        };
        Relationships: [];
      };
      rooms: {
        Row: {
          id: string;
          name: string;
          visibility: "public" | "private";
          owner_id: string;
          status: "active" | "archived";
          archived_at: string | null;
          archived_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          visibility?: "public" | "private";
          owner_id: string;
          status?: "active" | "archived";
          archived_at?: string | null;
          archived_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          visibility?: "public" | "private";
          owner_id?: string;
          status?: "active" | "archived";
          archived_at?: string | null;
          archived_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      room_memberships: {
        Row: {
          id: string;
          room_id: string;
          user_id: string;
          status: "active" | "left" | "removed";
          joined_at: string;
          left_at: string | null;
          removed_at: string | null;
          removed_by: string | null;
          removal_reason: string | null;
        };
        Insert: {
          id?: string;
          room_id: string;
          user_id: string;
          status?: "active" | "left" | "removed";
          joined_at?: string;
          left_at?: string | null;
          removed_at?: string | null;
          removed_by?: string | null;
          removal_reason?: string | null;
        };
        Update: {
          id?: string;
          room_id?: string;
          user_id?: string;
          status?: "active" | "left" | "removed";
          joined_at?: string;
          left_at?: string | null;
          removed_at?: string | null;
          removed_by?: string | null;
          removal_reason?: string | null;
        };
        Relationships: [];
      };
      join_requests: {
        Row: {
          id: string;
          room_id: string;
          requester_id: string;
          status: "pending" | "approved" | "rejected" | "cancelled";
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          requester_id: string;
          status?: "pending" | "approved" | "rejected" | "cancelled";
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          requester_id?: string;
          status?: "pending" | "approved" | "rejected" | "cancelled";
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      meeting_sessions: {
        Row: {
          id: string;
          room_id: string;
          title: string;
          starts_at: string;
          attendance_deadline: string;
          closes_at: string;
          status: "scheduled" | "active" | "closed";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          title?: string;
          starts_at: string;
          attendance_deadline: string;
          closes_at: string;
          status?: "scheduled" | "active" | "closed";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          title?: string;
          starts_at?: string;
          attendance_deadline?: string;
          closes_at?: string;
          status?: "scheduled" | "active" | "closed";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      attendance_records: {
        Row: {
          id: string;
          meeting_session_id: string;
          user_id: string;
          status: "present" | "absent" | "leave";
          changed_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          meeting_session_id: string;
          user_id: string;
          status: "present" | "absent" | "leave";
          changed_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          meeting_session_id?: string;
          user_id?: string;
          status?: "present" | "absent" | "leave";
          changed_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      fund_candidates: {
        Row: {
          id: string;
          meeting_session_id: string;
          user_id: string;
          suggested_amount: number;
          is_manual: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          meeting_session_id: string;
          user_id: string;
          suggested_amount: number;
          is_manual?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          meeting_session_id?: string;
          user_id?: string;
          suggested_amount?: number;
          is_manual?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      fund_contributions: {
        Row: {
          id: string;
          room_id: string;
          meeting_session_id: string | null;
          contributor_id: string;
          amount: number; // Integer VND
          reason: "Đi trễ" | "Bận nhưng chưa xin phép" | "Khác";
          reason_details: string | null;
          status: "outstanding" | "paid";
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          meeting_session_id?: string | null;
          contributor_id: string;
          amount: number;
          reason: "Đi trễ" | "Bận nhưng chưa xin phép" | "Khác";
          reason_details?: string | null;
          status?: "outstanding" | "paid";
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          meeting_session_id?: string | null;
          contributor_id?: string;
          amount?: number;
          reason?: "Đi trễ" | "Bận nhưng chưa xin phép" | "Khác";
          reason_details?: string | null;
          status?: "outstanding" | "paid";
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          contribution_id: string;
          amount: number; // Integer VND
          paid_at: string;
          confirmed_by: string;
          confirmed_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          contribution_id: string;
          amount: number;
          paid_at?: string;
          confirmed_by: string;
          confirmed_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          contribution_id?: string;
          amount?: number;
          paid_at?: string;
          confirmed_by?: string;
          confirmed_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      room_payment_images: {
        Row: {
          id: string;
          room_id: string;
          storage_path: string;
          mime_type: "image/jpeg" | "image/png" | "image/webp";
          file_size: number;
          sort_order: number;
          uploaded_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          storage_path: string;
          mime_type: "image/jpeg" | "image/png" | "image/webp";
          file_size: number;
          sort_order?: number;
          uploaded_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          storage_path?: string;
          mime_type?: "image/jpeg" | "image/png" | "image/webp";
          file_size?: number;
          sort_order?: number;
          uploaded_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          target_type: string;
          target_id: string;
          metadata: Json | null;
          occurred_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          target_type: string;
          target_id: string;
          metadata?: Json | null;
          occurred_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string | null;
          action?: string;
          target_type?: string;
          target_id?: string;
          metadata?: Json | null;
          occurred_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
