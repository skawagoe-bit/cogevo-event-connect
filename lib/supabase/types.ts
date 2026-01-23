export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          clerk_user_id: string
          email: string
          full_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clerk_user_id: string
          email: string
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clerk_user_id?: string
          email?: string
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          name: string
          event_date: string
          attributes_preset: Json | null
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          event_date: string
          attributes_preset?: Json | null
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          event_date?: string
          attributes_preset?: Json | null
          user_id?: string
          created_at?: string
        }
      }
      visitors: {
        Row: {
          id: string
          event_id: string
          name: string | null
          company: string | null
          email: string | null
          attribute: string | null
          segment: string | null
          image_url: string | null
          scanned_at: string
          is_sent: boolean
          sync_status: string | null
        }
        Insert: {
          id?: string
          event_id: string
          name?: string | null
          company?: string | null
          email?: string | null
          attribute?: string | null
          segment?: string | null
          image_url?: string | null
          scanned_at?: string
          is_sent?: boolean
          sync_status?: string | null
        }
        Update: {
          id?: string
          event_id?: string
          name?: string | null
          company?: string | null
          email?: string | null
          attribute?: string | null
          segment?: string | null
          image_url?: string | null
          scanned_at?: string
          is_sent?: boolean
          sync_status?: string | null
        }
      }
      trial_links: {
        Row: {
          id: string
          visitor_id: string
          token: string
          expires_at: string
          clicked_at: string | null
        }
        Insert: {
          id?: string
          visitor_id: string
          token: string
          expires_at: string
          clicked_at?: string | null
        }
        Update: {
          id?: string
          visitor_id?: string
          token?: string
          expires_at?: string
          clicked_at?: string | null
        }
      }
      gift_logs: {
        Row: {
          id: string
          visitor_id: string
          gift_name: string
          granted_at: string
        }
        Insert: {
          id?: string
          visitor_id: string
          gift_name: string
          granted_at?: string
        }
        Update: {
          id?: string
          visitor_id?: string
          gift_name?: string
          granted_at?: string
        }
      }
    }
  }
}
