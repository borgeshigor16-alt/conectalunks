export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          author_name: string
          body: string | null
          category: string
          created_at: string
          created_by: string | null
          excerpt: string
          id: string
          pinned: boolean
          sector_id: string
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
        }
        Insert: {
          author_name: string
          body?: string | null
          category: string
          created_at?: string
          created_by?: string | null
          excerpt: string
          id?: string
          pinned?: boolean
          sector_id: string
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at?: string
        }
        Update: {
          author_name?: string
          body?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          excerpt?: string
          id?: string
          pinned?: boolean
          sector_id?: string
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_articles: {
        Row: {
          category: string
          content: string
          created_at: string
          created_by: string | null
          id: string
          sector_id: string
          status: Database["public"]["Enums"]["content_status"]
          summary: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          sector_id: string
          status?: Database["public"]["Enums"]["content_status"]
          summary: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          sector_id?: string
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_articles_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          link: string | null
          message: string
          priority: string
          read_at: string | null
          recipient_user_id: string | null
          sector_id: string | null
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          link?: string | null
          message: string
          priority?: string
          read_at?: string | null
          recipient_user_id?: string | null
          sector_id?: string | null
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          link?: string | null
          message?: string
          priority?: string
          read_at?: string | null
          recipient_user_id?: string | null
          sector_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      people: {
        Row: {
          active: boolean
          bio: string | null
          created_at: string
          created_by: string | null
          email: string | null
          extension: string | null
          full_name: string
          id: string
          phone: string | null
          position: string
          sector_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          bio?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          extension?: string | null
          full_name: string
          id?: string
          phone?: string | null
          position: string
          sector_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          bio?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          extension?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          position?: string
          sector_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "people_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      process_checklists: {
        Row: {
          created_at: string
          description: string
          id: string
          item_order: number
          process_id: string
          required: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          item_order?: number
          process_id: string
          required?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          item_order?: number
          process_id?: string
          required?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_checklists_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      process_instance_checklist: {
        Row: {
          checklist_template_id: string | null
          completed: boolean
          completed_at: string | null
          completed_by: string | null
          created_at: string
          description: string
          id: string
          instance_id: string
          item_order: number
          required: boolean
        }
        Insert: {
          checklist_template_id?: string | null
          completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          description: string
          id?: string
          instance_id: string
          item_order: number
          required?: boolean
        }
        Update: {
          checklist_template_id?: string | null
          completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          description?: string
          id?: string
          instance_id?: string
          item_order?: number
          required?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "process_instance_checklist_checklist_template_id_fkey"
            columns: ["checklist_template_id"]
            isOneToOne: false
            referencedRelation: "process_checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_instance_checklist_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "process_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      process_instance_steps: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          instance_id: string
          notes: string | null
          responsible_person_id: string | null
          responsible_user_id: string | null
          sla_hours: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["step_status"]
          step_order: number
          step_template_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          instance_id: string
          notes?: string | null
          responsible_person_id?: string | null
          responsible_user_id?: string | null
          sla_hours?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["step_status"]
          step_order: number
          step_template_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          instance_id?: string
          notes?: string | null
          responsible_person_id?: string | null
          responsible_user_id?: string | null
          sla_hours?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["step_status"]
          step_order?: number
          step_template_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_instance_steps_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "process_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_instance_steps_responsible_person_id_fkey"
            columns: ["responsible_person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_instance_steps_responsible_person_id_fkey"
            columns: ["responsible_person_id"]
            isOneToOne: false
            referencedRelation: "people_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_instance_steps_step_template_id_fkey"
            columns: ["step_template_id"]
            isOneToOne: false
            referencedRelation: "process_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      process_instances: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          process_id: string
          sector_id: string
          started_at: string
          started_by: string | null
          status: Database["public"]["Enums"]["instance_status"]
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          process_id: string
          sector_id: string
          started_at?: string
          started_by?: string | null
          status?: Database["public"]["Enums"]["instance_status"]
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          process_id?: string
          sector_id?: string
          started_at?: string
          started_by?: string | null
          status?: Database["public"]["Enums"]["instance_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_instances_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_instances_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      process_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          instance_id: string
          performed_by: string | null
          step_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          instance_id: string
          performed_by?: string | null
          step_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          instance_id?: string
          performed_by?: string | null
          step_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "process_logs_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "process_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_logs_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "process_instance_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      process_steps: {
        Row: {
          created_at: string
          description: string | null
          id: string
          owner_sector_id: string | null
          process_id: string
          responsible_person_id: string | null
          sla_hours: number | null
          step_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          owner_sector_id?: string | null
          process_id: string
          responsible_person_id?: string | null
          sla_hours?: number | null
          step_order: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          owner_sector_id?: string | null
          process_id?: string
          responsible_person_id?: string | null
          sla_hours?: number | null
          step_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_steps_owner_sector_id_fkey"
            columns: ["owner_sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_steps_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_steps_responsible_person_id_fkey"
            columns: ["responsible_person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_steps_responsible_person_id_fkey"
            columns: ["responsible_person_id"]
            isOneToOne: false
            referencedRelation: "people_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      processes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          description: string
          id: string
          name: string
          sector_id: string
          sla: string | null
          status: Database["public"]["Enums"]["process_status"]
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          name: string
          sector_id: string
          sla?: string | null
          status?: Database["public"]["Enums"]["process_status"]
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          name?: string
          sector_id?: string
          sla?: string | null
          status?: Database["public"]["Enums"]["process_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "processes_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          position: string | null
          sector_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          position?: string | null
          sector_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          position?: string | null
          sector_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      sectors: {
        Row: {
          acronym: string
          active: boolean
          created_at: string
          description: string | null
          id: string
          leader_name: string | null
          name: string
          updated_at: string
        }
        Insert: {
          acronym: string
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          leader_name?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          acronym?: string
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          leader_name?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      people_directory: {
        Row: {
          active: boolean | null
          created_at: string | null
          full_name: string | null
          id: string | null
          position: string | null
          sector_id: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          position?: string | null
          sector_id?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          position?: string | null
          sector_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "people_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_manage_instance: { Args: { _instance_id: string }; Returns: boolean }
      can_manage_sector: { Args: { _sector_id: string }; Returns: boolean }
      get_user_sector: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "editor" | "viewer"
      content_status: "draft" | "published" | "archived"
      instance_status: "open" | "in_progress" | "completed" | "cancelled"
      process_status: "active" | "review" | "paused" | "archived"
      step_status: "pending" | "in_progress" | "done"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "editor", "viewer"],
      content_status: ["draft", "published", "archived"],
      instance_status: ["open", "in_progress", "completed", "cancelled"],
      process_status: ["active", "review", "paused", "archived"],
      step_status: ["pending", "in_progress", "done"],
    },
  },
} as const
