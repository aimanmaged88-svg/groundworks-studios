
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "attendance": {
                  Row: {
                    "club_id": string,"event_id": string,"id": string,"marked_at": string,"marked_by": string | null,"person_id": string,"present": boolean
                  }
                  Insert: {
                    "club_id": string,"event_id": string,"id"?: string,"marked_at"?: string,"marked_by"?: string | null,"person_id": string,"present": boolean
                  }
                  Update: {
                    "club_id"?: string,"event_id"?: string,"id"?: string,"marked_at"?: string,"marked_by"?: string | null,"person_id"?: string,"present"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "attendance_club_id_fkey"
      columns: ["club_id"]
isOneToOne: false
      referencedRelation: "clubs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "attendance_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "events"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "attendance_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    }
                  ]
                },"audit_log": {
                  Row: {
                    "action": string,"actor_user_id": string | null,"at": string,"club_id": string | null,"detail": NonNullable<Json>,"id": number,"impersonated_by": string | null,"ip_hash": string | null,"target_id": string | null,"target_table": string | null
                  }
                  Insert: {
                    "action": string,"actor_user_id"?: string | null,"at"?: string,"club_id"?: string | null,"detail"?: NonNullable<Json>,"id"?: never,"impersonated_by"?: string | null,"ip_hash"?: string | null,"target_id"?: string | null,"target_table"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_user_id"?: string | null,"at"?: string,"club_id"?: string | null,"detail"?: NonNullable<Json>,"id"?: never,"impersonated_by"?: string | null,"ip_hash"?: string | null,"target_id"?: string | null,"target_table"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "audit_log_club_id_fkey"
      columns: ["club_id"]
isOneToOne: false
      referencedRelation: "clubs"
      referencedColumns: ["id"]
    }
                  ]
                },"availability": {
                  Row: {
                    "club_id": string,"event_id": string,"id": string,"person_id": string,"set_by": string | null,"status": Database["public"]['Enums']["availability_status"],"updated_at": string
                  }
                  Insert: {
                    "club_id": string,"event_id": string,"id"?: string,"person_id": string,"set_by"?: string | null,"status"?: Database["public"]['Enums']["availability_status"],"updated_at"?: string
                  }
                  Update: {
                    "club_id"?: string,"event_id"?: string,"id"?: string,"person_id"?: string,"set_by"?: string | null,"status"?: Database["public"]['Enums']["availability_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "availability_club_id_fkey"
      columns: ["club_id"]
isOneToOne: false
      referencedRelation: "clubs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "availability_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "events"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "availability_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    }
                  ]
                },"club_users": {
                  Row: {
                    "club_id": string,"created_at": string,"id": string,"invited_by": string | null,"role": Database["public"]['Enums']["club_role"],"status": Database["public"]['Enums']["membership_status"],"user_id": string
                  }
                  Insert: {
                    "club_id": string,"created_at"?: string,"id"?: string,"invited_by"?: string | null,"role": Database["public"]['Enums']["club_role"],"status"?: Database["public"]['Enums']["membership_status"],"user_id": string
                  }
                  Update: {
                    "club_id"?: string,"created_at"?: string,"id"?: string,"invited_by"?: string | null,"role"?: Database["public"]['Enums']["club_role"],"status"?: Database["public"]['Enums']["membership_status"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "club_users_club_id_fkey"
      columns: ["club_id"]
isOneToOne: false
      referencedRelation: "clubs"
      referencedColumns: ["id"]
    }
                  ]
                },"clubs": {
                  Row: {
                    "colours": NonNullable<Json>,"contact_email": string | null,"contact_phone": string | null,"created_at": string,"created_by": string | null,"id": string,"instagram_handle": string | null,"is_demo": boolean,"logo_path": string | null,"name": string,"onboarding_step": number,"public_page": NonNullable<Json>,"settings": NonNullable<Json>,"short_name": string | null,"slug": string,"sport_key": string,"state": string | null,"status": Database["public"]['Enums']["club_status"],"suburb": string | null,"theme_default": Database["public"]['Enums']["theme_pref"],"timezone": string,"updated_at": string,"website": string | null
                  }
                  Insert: {
                    "colours"?: NonNullable<Json>,"contact_email"?: string | null,"contact_phone"?: string | null,"created_at"?: string,"created_by"?: string | null,"id"?: string,"instagram_handle"?: string | null,"is_demo"?: boolean,"logo_path"?: string | null,"name": string,"onboarding_step"?: number,"public_page"?: NonNullable<Json>,"settings"?: NonNullable<Json>,"short_name"?: string | null,"slug": string,"sport_key": string,"state"?: string | null,"status"?: Database["public"]['Enums']["club_status"],"suburb"?: string | null,"theme_default"?: Database["public"]['Enums']["theme_pref"],"timezone"?: string,"updated_at"?: string,"website"?: string | null
                  }
                  Update: {
                    "colours"?: NonNullable<Json>,"contact_email"?: string | null,"contact_phone"?: string | null,"created_at"?: string,"created_by"?: string | null,"id"?: string,"instagram_handle"?: string | null,"is_demo"?: boolean,"logo_path"?: string | null,"name"?: string,"onboarding_step"?: number,"public_page"?: NonNullable<Json>,"settings"?: NonNullable<Json>,"short_name"?: string | null,"slug"?: string,"sport_key"?: string,"state"?: string | null,"status"?: Database["public"]['Enums']["club_status"],"suburb"?: string | null,"theme_default"?: Database["public"]['Enums']["theme_pref"],"timezone"?: string,"updated_at"?: string,"website"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "clubs_sport_key_fkey"
      columns: ["sport_key"]
isOneToOne: false
      referencedRelation: "sports"
      referencedColumns: ["key"]
    }
                  ]
                },"coach_clearances": {
                  Row: {
                    "club_id": string,"created_at": string,"expires_on": string | null,"id": string,"kind": Database["public"]['Enums']["clearance_kind"],"note": string | null,"number_last4": string | null,"person_id": string,"verified_at": string | null,"verified_by": string | null
                  }
                  Insert: {
                    "club_id": string,"created_at"?: string,"expires_on"?: string | null,"id"?: string,"kind"?: Database["public"]['Enums']["clearance_kind"],"note"?: string | null,"number_last4"?: string | null,"person_id": string,"verified_at"?: string | null,"verified_by"?: string | null
                  }
                  Update: {
                    "club_id"?: string,"created_at"?: string,"expires_on"?: string | null,"id"?: string,"kind"?: Database["public"]['Enums']["clearance_kind"],"note"?: string | null,"number_last4"?: string | null,"person_id"?: string,"verified_at"?: string | null,"verified_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "coach_clearances_club_id_fkey"
      columns: ["club_id"]
isOneToOne: false
      referencedRelation: "clubs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "coach_clearances_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    }
                  ]
                },"coach_notes": {
                  Row: {
                    "author_user_id": string,"body": string,"club_id": string,"created_at": string,"id": string,"person_id": string
                  }
                  Insert: {
                    "author_user_id": string,"body": string,"club_id": string,"created_at"?: string,"id"?: string,"person_id": string
                  }
                  Update: {
                    "author_user_id"?: string,"body"?: string,"club_id"?: string,"created_at"?: string,"id"?: string,"person_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "coach_notes_club_id_fkey"
      columns: ["club_id"]
isOneToOne: false
      referencedRelation: "clubs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "coach_notes_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    }
                  ]
                },"consents": {
                  Row: {
                    "club_id": string,"consent_key": string,"created_at": string,"form_version": number | null,"granted": boolean,"granted_at": string,"granted_by_person_id": string | null,"id": string,"person_id": string,"registration_id": string | null,"text_shown": string
                  }
                  Insert: {
                    "club_id": string,"consent_key": string,"created_at"?: string,"form_version"?: number | null,"granted": boolean,"granted_at"?: string,"granted_by_person_id"?: string | null,"id"?: string,"person_id": string,"registration_id"?: string | null,"text_shown": string
                  }
                  Update: {
                    "club_id"?: string,"consent_key"?: string,"created_at"?: string,"form_version"?: number | null,"granted"?: boolean,"granted_at"?: string,"granted_by_person_id"?: string | null,"id"?: string,"person_id"?: string,"registration_id"?: string | null,"text_shown"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "consents_club_id_fkey"
      columns: ["club_id"]
isOneToOne: false
      referencedRelation: "clubs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "consents_granted_by_person_id_fkey"
      columns: ["granted_by_person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "consents_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "consents_registration_id_fkey"
      columns: ["registration_id"]
isOneToOne: false
      referencedRelation: "registrations"
      referencedColumns: ["id"]
    }
                  ]
                },"divisions": {
                  Row: {
                    "born_from": number | null,"born_to": number | null,"club_id": string,"created_at": string,"gender": string | null,"id": string,"max_age": number | null,"min_age": number | null,"name": string,"season_id": string,"sort": number
                  }
                  Insert: {
                    "born_from"?: number | null,"born_to"?: number | null,"club_id": string,"created_at"?: string,"gender"?: string | null,"id"?: string,"max_age"?: number | null,"min_age"?: number | null,"name": string,"season_id": string,"sort"?: number
                  }
                  Update: {
                    "born_from"?: number | null,"born_to"?: number | null,"club_id"?: string,"created_at"?: string,"gender"?: string | null,"id"?: string,"max_age"?: number | null,"min_age"?: number | null,"name"?: string,"season_id"?: string,"sort"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "divisions_club_id_fkey"
      columns: ["club_id"]
isOneToOne: false
      referencedRelation: "clubs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "divisions_season_id_fkey"
      columns: ["season_id"]
isOneToOne: false
      referencedRelation: "seasons"
      referencedColumns: ["id"]
    }
                  ]
                },"events": {
                  Row: {
                    "club_id": string,"created_at": string,"created_by": string | null,"ends_at": string | null,"id": string,"kind": Database["public"]['Enums']["event_kind"],"notes": string | null,"opponent": string | null,"result": Json | null,"season_id": string | null,"starts_at": string,"team_id": string | null,"title": string | null,"venue_id": string | null
                  }
                  Insert: {
                    "club_id": string,"created_at"?: string,"created_by"?: string | null,"ends_at"?: string | null,"id"?: string,"kind"?: Database["public"]['Enums']["event_kind"],"notes"?: string | null,"opponent"?: string | null,"result"?: Json | null,"season_id"?: string | null,"starts_at": string,"team_id"?: string | null,"title"?: string | null,"venue_id"?: string | null
                  }
                  Update: {
                    "club_id"?: string,"created_at"?: string,"created_by"?: string | null,"ends_at"?: string | null,"id"?: string,"kind"?: Database["public"]['Enums']["event_kind"],"notes"?: string | null,"opponent"?: string | null,"result"?: Json | null,"season_id"?: string | null,"starts_at"?: string,"team_id"?: string | null,"title"?: string | null,"venue_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "events_club_id_fkey"
      columns: ["club_id"]
isOneToOne: false
      referencedRelation: "clubs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "events_season_id_fkey"
      columns: ["season_id"]
isOneToOne: false
      referencedRelation: "seasons"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "events_team_id_fkey"
      columns: ["team_id"]
isOneToOne: false
      referencedRelation: "teams"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "events_venue_id_fkey"
      columns: ["venue_id"]
isOneToOne: false
      referencedRelation: "venues"
      referencedColumns: ["id"]
    }
                  ]
                },"fees": {
                  Row: {
                    "amount_cents": number,"club_id": string,"created_at": string,"due_on": string | null,"id": string,"note": string | null,"person_id": string,"season_id": string | null,"status": Database["public"]['Enums']["fee_status"],"updated_at": string
                  }
                  Insert: {
                    "amount_cents": number,"club_id": string,"created_at"?: string,"due_on"?: string | null,"id"?: string,"note"?: string | null,"person_id": string,"season_id"?: string | null,"status"?: Database["public"]['Enums']["fee_status"],"updated_at"?: string
                  }
                  Update: {
                    "amount_cents"?: number,"club_id"?: string,"created_at"?: string,"due_on"?: string | null,"id"?: string,"note"?: string | null,"person_id"?: string,"season_id"?: string | null,"status"?: Database["public"]['Enums']["fee_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "fees_club_id_fkey"
      columns: ["club_id"]
isOneToOne: false
      referencedRelation: "clubs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "fees_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "fees_season_id_fkey"
      columns: ["season_id"]
isOneToOne: false
      referencedRelation: "seasons"
      referencedColumns: ["id"]
    }
                  ]
                },"form_templates": {
                  Row: {
                    "club_id": string,"collection_notice": string | null,"consents": NonNullable<Json>,"created_at": string,"created_by": string | null,"fields": NonNullable<Json>,"id": string,"intro": string | null,"is_active": boolean,"name": string,"published_at": string | null,"version": number
                  }
                  Insert: {
                    "club_id": string,"collection_notice"?: string | null,"consents"?: NonNullable<Json>,"created_at"?: string,"created_by"?: string | null,"fields"?: NonNullable<Json>,"id"?: string,"intro"?: string | null,"is_active"?: boolean,"name"?: string,"published_at"?: string | null,"version"?: number
                  }
                  Update: {
                    "club_id"?: string,"collection_notice"?: string | null,"consents"?: NonNullable<Json>,"created_at"?: string,"created_by"?: string | null,"fields"?: NonNullable<Json>,"id"?: string,"intro"?: string | null,"is_active"?: boolean,"name"?: string,"published_at"?: string | null,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "form_templates_club_id_fkey"
      columns: ["club_id"]
isOneToOne: false
      referencedRelation: "clubs"
      referencedColumns: ["id"]
    }
                  ]
                },"guardianships": {
                  Row: {
                    "child_person_id": string,"club_id": string,"created_at": string,"guardian_person_id": string,"id": string,"is_primary": boolean,"relationship": string | null
                  }
                  Insert: {
                    "child_person_id": string,"club_id": string,"created_at"?: string,"guardian_person_id": string,"id"?: string,"is_primary"?: boolean,"relationship"?: string | null
                  }
                  Update: {
                    "child_person_id"?: string,"club_id"?: string,"created_at"?: string,"guardian_person_id"?: string,"id"?: string,"is_primary"?: boolean,"relationship"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "guardianships_child_person_id_fkey"
      columns: ["child_person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "guardianships_club_id_fkey"
      columns: ["club_id"]
isOneToOne: false
      referencedRelation: "clubs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "guardianships_guardian_person_id_fkey"
      columns: ["guardian_person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    }
                  ]
                },"imports": {
                  Row: {
                    "club_id": string,"created_at": string,"file_name": string | null,"id": string,"imported_by": string | null,"mapping": NonNullable<Json>,"result": NonNullable<Json>,"row_count": number | null
                  }
                  Insert: {
                    "club_id": string,"created_at"?: string,"file_name"?: string | null,"id"?: string,"imported_by"?: string | null,"mapping"?: NonNullable<Json>,"result"?: NonNullable<Json>,"row_count"?: number | null
                  }
                  Update: {
                    "club_id"?: string,"created_at"?: string,"file_name"?: string | null,"id"?: string,"imported_by"?: string | null,"mapping"?: NonNullable<Json>,"result"?: NonNullable<Json>,"row_count"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "imports_club_id_fkey"
      columns: ["club_id"]
isOneToOne: false
      referencedRelation: "clubs"
      referencedColumns: ["id"]
    }
                  ]
                },"invites": {
                  Row: {
                    "accepted_at": string | null,"accepted_by": string | null,"club_id": string,"created_at": string,"email": string,"expires_at": string,"id": string,"invited_by": string | null,"person_id": string | null,"role": Database["public"]['Enums']["club_role"],"token_hash": string
                  }
                  Insert: {
                    "accepted_at"?: string | null,"accepted_by"?: string | null,"club_id": string,"created_at"?: string,"email": string,"expires_at"?: string,"id"?: string,"invited_by"?: string | null,"person_id"?: string | null,"role": Database["public"]['Enums']["club_role"],"token_hash": string
                  }
                  Update: {
                    "accepted_at"?: string | null,"accepted_by"?: string | null,"club_id"?: string,"created_at"?: string,"email"?: string,"expires_at"?: string,"id"?: string,"invited_by"?: string | null,"person_id"?: string | null,"role"?: Database["public"]['Enums']["club_role"],"token_hash"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "invites_club_id_fkey"
      columns: ["club_id"]
isOneToOne: false
      referencedRelation: "clubs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invites_person_fk"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    }
                  ]
                },"leads": {
                  Row: {
                    "club_name": string,"colours": NonNullable<Json>,"contact_name": string | null,"created_at": string,"email": string | null,"id": string,"instagram": string | null,"ip_hash": string | null,"logo_url": string | null,"message": string | null,"mobile": string | null,"source": string,"sport_key": string | null,"suburb": string | null
                  }
                  Insert: {
                    "club_name": string,"colours"?: NonNullable<Json>,"contact_name"?: string | null,"created_at"?: string,"email"?: string | null,"id"?: string,"instagram"?: string | null,"ip_hash"?: string | null,"logo_url"?: string | null,"message"?: string | null,"mobile"?: string | null,"source"?: string,"sport_key"?: string | null,"suburb"?: string | null
                  }
                  Update: {
                    "club_name"?: string,"colours"?: NonNullable<Json>,"contact_name"?: string | null,"created_at"?: string,"email"?: string | null,"id"?: string,"instagram"?: string | null,"ip_hash"?: string | null,"logo_url"?: string | null,"message"?: string | null,"mobile"?: string | null,"source"?: string,"sport_key"?: string | null,"suburb"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"level_config": {
                  Row: {
                    "badges": NonNullable<Json>,"club_id": string,"levels": NonNullable<Json>,"skills": NonNullable<Json>,"updated_at": string
                  }
                  Insert: {
                    "badges"?: NonNullable<Json>,"club_id": string,"levels"?: NonNullable<Json>,"skills"?: NonNullable<Json>,"updated_at"?: string
                  }
                  Update: {
                    "badges"?: NonNullable<Json>,"club_id"?: string,"levels"?: NonNullable<Json>,"skills"?: NonNullable<Json>,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "level_config_club_id_fkey"
      columns: ["club_id"]
isOneToOne: true
      referencedRelation: "clubs"
      referencedColumns: ["id"]
    }
                  ]
                },"notices": {
                  Row: {
                    "audience": NonNullable<Json>,"body": string,"club_id": string,"created_at": string,"created_by": string | null,"id": string,"published_at": string | null,"title": string
                  }
                  Insert: {
                    "audience"?: NonNullable<Json>,"body": string,"club_id": string,"created_at"?: string,"created_by"?: string | null,"id"?: string,"published_at"?: string | null,"title": string
                  }
                  Update: {
                    "audience"?: NonNullable<Json>,"body"?: string,"club_id"?: string,"created_at"?: string,"created_by"?: string | null,"id"?: string,"published_at"?: string | null,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notices_club_id_fkey"
      columns: ["club_id"]
isOneToOne: false
      referencedRelation: "clubs"
      referencedColumns: ["id"]
    }
                  ]
                },"payments": {
                  Row: {
                    "amount_cents": number,"club_id": string,"created_at": string,"fee_id": string,"id": string,"method": Database["public"]['Enums']["payment_method"],"paid_on": string,"recorded_by": string | null,"reference": string | null
                  }
                  Insert: {
                    "amount_cents": number,"club_id": string,"created_at"?: string,"fee_id": string,"id"?: string,"method"?: Database["public"]['Enums']["payment_method"],"paid_on"?: string,"recorded_by"?: string | null,"reference"?: string | null
                  }
                  Update: {
                    "amount_cents"?: number,"club_id"?: string,"created_at"?: string,"fee_id"?: string,"id"?: string,"method"?: Database["public"]['Enums']["payment_method"],"paid_on"?: string,"recorded_by"?: string | null,"reference"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "payments_club_id_fkey"
      columns: ["club_id"]
isOneToOne: false
      referencedRelation: "clubs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payments_fee_id_fkey"
      columns: ["fee_id"]
isOneToOne: false
      referencedRelation: "fees"
      referencedColumns: ["id"]
    }
                  ]
                },"people": {
                  Row: {
                    "archived_at": string | null,"archived_by": string | null,"club_id": string,"created_at": string,"dob": string | null,"email": string | null,"first_name": string,"gender": string | null,"has_medical_flag": boolean,"id": string,"kind": Database["public"]['Enums']["person_kind"],"last_name": string,"mobile": string | null,"photo_consent": boolean | null,"school": string | null,"updated_at": string,"user_id": string | null
                  }
                  Insert: {
                    "archived_at"?: string | null,"archived_by"?: string | null,"club_id": string,"created_at"?: string,"dob"?: string | null,"email"?: string | null,"first_name": string,"gender"?: string | null,"has_medical_flag"?: boolean,"id"?: string,"kind": Database["public"]['Enums']["person_kind"],"last_name"?: string,"mobile"?: string | null,"photo_consent"?: boolean | null,"school"?: string | null,"updated_at"?: string,"user_id"?: string | null
                  }
                  Update: {
                    "archived_at"?: string | null,"archived_by"?: string | null,"club_id"?: string,"created_at"?: string,"dob"?: string | null,"email"?: string | null,"first_name"?: string,"gender"?: string | null,"has_medical_flag"?: boolean,"id"?: string,"kind"?: Database["public"]['Enums']["person_kind"],"last_name"?: string,"mobile"?: string | null,"photo_consent"?: boolean | null,"school"?: string | null,"updated_at"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "people_club_id_fkey"
      columns: ["club_id"]
isOneToOne: false
      referencedRelation: "clubs"
      referencedColumns: ["id"]
    }
                  ]
                },"person_sensitive": {
                  Row: {
                    "ambulance_cover": string | null,"club_id": string,"emergency_name": string | null,"emergency_phone": string | null,"emergency_relationship": string | null,"medical": string | null,"person_id": string,"updated_at": string,"updated_by": string | null
                  }
                  Insert: {
                    "ambulance_cover"?: string | null,"club_id": string,"emergency_name"?: string | null,"emergency_phone"?: string | null,"emergency_relationship"?: string | null,"medical"?: string | null,"person_id": string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "ambulance_cover"?: string | null,"club_id"?: string,"emergency_name"?: string | null,"emergency_phone"?: string | null,"emergency_relationship"?: string | null,"medical"?: string | null,"person_id"?: string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "person_sensitive_club_id_fkey"
      columns: ["club_id"]
isOneToOne: false
      referencedRelation: "clubs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "person_sensitive_person_id_fkey"
      columns: ["person_id"]
isOneToOne: true
      referencedRelation: "people"
      referencedColumns: ["id"]
    }
                  ]
                },"platform_users": {
                  Row: {
                    "created_at": string,"note": string | null,"user_id": string
                  }
                  Insert: {
                    "created_at"?: string,"note"?: string | null,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"note"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"rate_limits": {
                  Row: {
                    "count": number,"key": string,"window_start": string
                  }
                  Insert: {
                    "count"?: number,"key": string,"window_start"?: string
                  }
                  Update: {
                    "count"?: number,"key"?: string,"window_start"?: string
                  }
                  Relationships: [
                    
                  ]
                },"registrations": {
                  Row: {
                    "club_id": string,"created_at": string,"custom": NonNullable<Json>,"experience": string | null,"form_template_id": string | null,"form_version": number | null,"guardian_person_id": string | null,"heard_via": string | null,"id": string,"ip_hash": string | null,"notes": string | null,"player_person_id": string,"possible_duplicate": boolean,"reviewed_at": string | null,"reviewed_by": string | null,"season_id": string | null,"source": Database["public"]['Enums']["registration_source"],"status": Database["public"]['Enums']["registration_status"],"submitted_at": string,"uniform_size": string | null,"updated_at": string,"user_agent": string | null
                  }
                  Insert: {
                    "club_id": string,"created_at"?: string,"custom"?: NonNullable<Json>,"experience"?: string | null,"form_template_id"?: string | null,"form_version"?: number | null,"guardian_person_id"?: string | null,"heard_via"?: string | null,"id"?: string,"ip_hash"?: string | null,"notes"?: string | null,"player_person_id": string,"possible_duplicate"?: boolean,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"season_id"?: string | null,"source"?: Database["public"]['Enums']["registration_source"],"status"?: Database["public"]['Enums']["registration_status"],"submitted_at"?: string,"uniform_size"?: string | null,"updated_at"?: string,"user_agent"?: string | null
                  }
                  Update: {
                    "club_id"?: string,"created_at"?: string,"custom"?: NonNullable<Json>,"experience"?: string | null,"form_template_id"?: string | null,"form_version"?: number | null,"guardian_person_id"?: string | null,"heard_via"?: string | null,"id"?: string,"ip_hash"?: string | null,"notes"?: string | null,"player_person_id"?: string,"possible_duplicate"?: boolean,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"season_id"?: string | null,"source"?: Database["public"]['Enums']["registration_source"],"status"?: Database["public"]['Enums']["registration_status"],"submitted_at"?: string,"uniform_size"?: string | null,"updated_at"?: string,"user_agent"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "registrations_club_id_fkey"
      columns: ["club_id"]
isOneToOne: false
      referencedRelation: "clubs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "registrations_form_template_id_fkey"
      columns: ["form_template_id"]
isOneToOne: false
      referencedRelation: "form_templates"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "registrations_guardian_person_id_fkey"
      columns: ["guardian_person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "registrations_player_person_id_fkey"
      columns: ["player_person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "registrations_season_id_fkey"
      columns: ["season_id"]
isOneToOne: false
      referencedRelation: "seasons"
      referencedColumns: ["id"]
    }
                  ]
                },"seasons": {
                  Row: {
                    "age_cutoff_date": string | null,"age_rule_mode": Database["public"]['Enums']["age_rule_mode"],"club_id": string,"created_at": string,"ends_on": string | null,"fee_cents": number | null,"fee_label": string | null,"id": string,"is_current": boolean,"name": string,"registration_open": boolean,"starts_on": string | null,"updated_at": string
                  }
                  Insert: {
                    "age_cutoff_date"?: string | null,"age_rule_mode"?: Database["public"]['Enums']["age_rule_mode"],"club_id": string,"created_at"?: string,"ends_on"?: string | null,"fee_cents"?: number | null,"fee_label"?: string | null,"id"?: string,"is_current"?: boolean,"name": string,"registration_open"?: boolean,"starts_on"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "age_cutoff_date"?: string | null,"age_rule_mode"?: Database["public"]['Enums']["age_rule_mode"],"club_id"?: string,"created_at"?: string,"ends_on"?: string | null,"fee_cents"?: number | null,"fee_label"?: string | null,"id"?: string,"is_current"?: boolean,"name"?: string,"registration_open"?: boolean,"starts_on"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "seasons_club_id_fkey"
      columns: ["club_id"]
isOneToOne: false
      referencedRelation: "clubs"
      referencedColumns: ["id"]
    }
                  ]
                },"skill_ratings": {
                  Row: {
                    "club_id": string,"id": string,"person_id": string,"rated_at": string,"rated_by": string | null,"rating": number,"skill_key": string
                  }
                  Insert: {
                    "club_id": string,"id"?: string,"person_id": string,"rated_at"?: string,"rated_by"?: string | null,"rating": number,"skill_key": string
                  }
                  Update: {
                    "club_id"?: string,"id"?: string,"person_id"?: string,"rated_at"?: string,"rated_by"?: string | null,"rating"?: number,"skill_key"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "skill_ratings_club_id_fkey"
      columns: ["club_id"]
isOneToOne: false
      referencedRelation: "clubs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "skill_ratings_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    }
                  ]
                },"sports": {
                  Row: {
                    "default_badges": NonNullable<Json>,"default_divisions": NonNullable<Json>,"default_levels": NonNullable<Json>,"default_skills": NonNullable<Json>,"key": string,"name": string,"sort": number,"vocabulary": NonNullable<Json>
                  }
                  Insert: {
                    "default_badges"?: NonNullable<Json>,"default_divisions"?: NonNullable<Json>,"default_levels"?: NonNullable<Json>,"default_skills"?: NonNullable<Json>,"key": string,"name": string,"sort"?: number,"vocabulary"?: NonNullable<Json>
                  }
                  Update: {
                    "default_badges"?: NonNullable<Json>,"default_divisions"?: NonNullable<Json>,"default_levels"?: NonNullable<Json>,"default_skills"?: NonNullable<Json>,"key"?: string,"name"?: string,"sort"?: number,"vocabulary"?: NonNullable<Json>
                  }
                  Relationships: [
                    
                  ]
                },"submissions": {
                  Row: {
                    "body": NonNullable<Json>,"club_id": string,"created_at": string,"handled_by": string | null,"id": string,"kind": Database["public"]['Enums']["submission_kind"],"person_id": string | null,"status": Database["public"]['Enums']["submission_status"],"submitted_by": string | null,"updated_at": string
                  }
                  Insert: {
                    "body"?: NonNullable<Json>,"club_id": string,"created_at"?: string,"handled_by"?: string | null,"id"?: string,"kind": Database["public"]['Enums']["submission_kind"],"person_id"?: string | null,"status"?: Database["public"]['Enums']["submission_status"],"submitted_by"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "body"?: NonNullable<Json>,"club_id"?: string,"created_at"?: string,"handled_by"?: string | null,"id"?: string,"kind"?: Database["public"]['Enums']["submission_kind"],"person_id"?: string | null,"status"?: Database["public"]['Enums']["submission_status"],"submitted_by"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "submissions_club_id_fkey"
      columns: ["club_id"]
isOneToOne: false
      referencedRelation: "clubs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "submissions_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    }
                  ]
                },"subscriptions": {
                  Row: {
                    "cancel_at_period_end": boolean,"club_id": string,"current_period_end": string | null,"member_limit": number,"plan": Database["public"]['Enums']["plan_key"],"status": Database["public"]['Enums']["subscription_status"],"stripe_customer_id": string | null,"stripe_subscription_id": string | null,"trial_ends_at": string | null,"updated_at": string
                  }
                  Insert: {
                    "cancel_at_period_end"?: boolean,"club_id": string,"current_period_end"?: string | null,"member_limit"?: number,"plan"?: Database["public"]['Enums']["plan_key"],"status"?: Database["public"]['Enums']["subscription_status"],"stripe_customer_id"?: string | null,"stripe_subscription_id"?: string | null,"trial_ends_at"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "cancel_at_period_end"?: boolean,"club_id"?: string,"current_period_end"?: string | null,"member_limit"?: number,"plan"?: Database["public"]['Enums']["plan_key"],"status"?: Database["public"]['Enums']["subscription_status"],"stripe_customer_id"?: string | null,"stripe_subscription_id"?: string | null,"trial_ends_at"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "subscriptions_club_id_fkey"
      columns: ["club_id"]
isOneToOne: true
      referencedRelation: "clubs"
      referencedColumns: ["id"]
    }
                  ]
                },"tasks": {
                  Row: {
                    "club_id": string,"created_at": string,"created_by": string | null,"done_at": string | null,"due_on": string | null,"id": string,"linked_person_id": string | null,"owner_user_id": string | null,"status": Database["public"]['Enums']["task_status"],"title": string
                  }
                  Insert: {
                    "club_id": string,"created_at"?: string,"created_by"?: string | null,"done_at"?: string | null,"due_on"?: string | null,"id"?: string,"linked_person_id"?: string | null,"owner_user_id"?: string | null,"status"?: Database["public"]['Enums']["task_status"],"title": string
                  }
                  Update: {
                    "club_id"?: string,"created_at"?: string,"created_by"?: string | null,"done_at"?: string | null,"due_on"?: string | null,"id"?: string,"linked_person_id"?: string | null,"owner_user_id"?: string | null,"status"?: Database["public"]['Enums']["task_status"],"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "tasks_club_id_fkey"
      columns: ["club_id"]
isOneToOne: false
      referencedRelation: "clubs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tasks_linked_person_id_fkey"
      columns: ["linked_person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    }
                  ]
                },"team_members": {
                  Row: {
                    "club_id": string,"created_at": string,"id": string,"jersey_number": string | null,"person_id": string,"role": string,"team_id": string
                  }
                  Insert: {
                    "club_id": string,"created_at"?: string,"id"?: string,"jersey_number"?: string | null,"person_id": string,"role": string,"team_id": string
                  }
                  Update: {
                    "club_id"?: string,"created_at"?: string,"id"?: string,"jersey_number"?: string | null,"person_id"?: string,"role"?: string,"team_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "team_members_club_id_fkey"
      columns: ["club_id"]
isOneToOne: false
      referencedRelation: "clubs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "team_members_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "team_members_team_id_fkey"
      columns: ["team_id"]
isOneToOne: false
      referencedRelation: "teams"
      referencedColumns: ["id"]
    }
                  ]
                },"teams": {
                  Row: {
                    "archived_at": string | null,"club_id": string,"colour": string | null,"created_at": string,"division_id": string | null,"id": string,"name": string,"season_id": string,"venue_id": string | null
                  }
                  Insert: {
                    "archived_at"?: string | null,"club_id": string,"colour"?: string | null,"created_at"?: string,"division_id"?: string | null,"id"?: string,"name": string,"season_id": string,"venue_id"?: string | null
                  }
                  Update: {
                    "archived_at"?: string | null,"club_id"?: string,"colour"?: string | null,"created_at"?: string,"division_id"?: string | null,"id"?: string,"name"?: string,"season_id"?: string,"venue_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "teams_club_id_fkey"
      columns: ["club_id"]
isOneToOne: false
      referencedRelation: "clubs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "teams_division_id_fkey"
      columns: ["division_id"]
isOneToOne: false
      referencedRelation: "divisions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "teams_season_id_fkey"
      columns: ["season_id"]
isOneToOne: false
      referencedRelation: "seasons"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "teams_venue_id_fkey"
      columns: ["venue_id"]
isOneToOne: false
      referencedRelation: "venues"
      referencedColumns: ["id"]
    }
                  ]
                },"user_profiles": {
                  Row: {
                    "created_at": string,"full_name": string | null,"last_club_id": string | null,"theme": Database["public"]['Enums']["theme_pref"],"updated_at": string,"user_id": string
                  }
                  Insert: {
                    "created_at"?: string,"full_name"?: string | null,"last_club_id"?: string | null,"theme"?: Database["public"]['Enums']["theme_pref"],"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"full_name"?: string | null,"last_club_id"?: string | null,"theme"?: Database["public"]['Enums']["theme_pref"],"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "user_profiles_last_club_id_fkey"
      columns: ["last_club_id"]
isOneToOne: false
      referencedRelation: "clubs"
      referencedColumns: ["id"]
    }
                  ]
                },"venues": {
                  Row: {
                    "address": string | null,"club_id": string,"created_at": string,"id": string,"map_url": string | null,"name": string
                  }
                  Insert: {
                    "address"?: string | null,"club_id": string,"created_at"?: string,"id"?: string,"map_url"?: string | null,"name": string
                  }
                  Update: {
                    "address"?: string | null,"club_id"?: string,"created_at"?: string,"id"?: string,"map_url"?: string | null,"name"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "venues_club_id_fkey"
      columns: ["club_id"]
isOneToOne: false
      referencedRelation: "clubs"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "club_public": {
                  Row: {
                    "colours": Json | null,"instagram_handle": string | null,"is_demo": boolean | null,"logo_path": string | null,"name": string | null,"public_page": Json | null,"short_name": string | null,"slug": string | null,"sport_key": string | null,"state": string | null,"suburb": string | null,"theme_default": Database["public"]['Enums']["theme_pref"] | null,"timezone": string | null,"website": string | null
                  }
                  Insert: {
                           "colours"?: Json | null,"instagram_handle"?: string | null,"is_demo"?: boolean | null,"logo_path"?: string | null,"name"?: string | null,"public_page"?: Json | null,"short_name"?: string | null,"slug"?: string | null,"sport_key"?: string | null,"state"?: string | null,"suburb"?: string | null,"theme_default"?: Database["public"]['Enums']["theme_pref"] | null,"timezone"?: string | null,"website"?: string | null
                         }
                        Update: {
                           "colours"?: Json | null,"instagram_handle"?: string | null,"is_demo"?: boolean | null,"logo_path"?: string | null,"name"?: string | null,"public_page"?: Json | null,"short_name"?: string | null,"slug"?: string | null,"sport_key"?: string | null,"state"?: string | null,"suburb"?: string | null,"theme_default"?: Database["public"]['Enums']["theme_pref"] | null,"timezone"?: string | null,"website"?: string | null
                         }
                        Relationships: [
                    {
      foreignKeyName: "clubs_sport_key_fkey"
      columns: ["sport_key"]
isOneToOne: false
      referencedRelation: "sports"
      referencedColumns: ["key"]
    }
                  ]
                }
          }
          Functions: {
            "accept_invite":
{ Args: { "p_token": string }; Returns: string
                           },
"age_group_for":
{ Args: { "p_dob": string,"p_season_id": string }; Returns: string
                           },
"create_club":
{ Args: { "p_name": string,"p_slug": string,"p_sport_key": string }; Returns: string
                           },
"create_invite":
{ Args: { "p_club": string,"p_email": string,"p_person_id"?: string,"p_role": Database["public"]['Enums']["club_role"] }; Returns: string
                           },
"get_person_sensitive":
{ Args: { "p_person_id": string }; Returns: {
              "ambulance_cover": string,"emergency_name": string,"emergency_phone": string,"emergency_relationship": string,"medical": string,"updated_at": string
            }[]
                           },
"get_public_form":
{ Args: { "p_slug": string }; Returns: Json
                           },
"my_clubs":
{ Args: Record<PropertyKey, never>; Returns: {
              "club_id": string,"colours": Json,"is_demo": boolean,"logo_path": string,"name": string,"roles": (Database["public"]['Enums']["club_role"])[],"slug": string,"status": Database["public"]['Enums']["club_status"]
            }[]
                           },
"rate_limit_hit":
{ Args: { "p_key": string,"p_limit": number,"p_window": string }; Returns: boolean
                           },
"submit_registration":
{ Args: { "p_club_slug": string,"p_ip_hash"?: string,"p_payload": Json,"p_source"?: Database["public"]['Enums']["registration_source"],"p_user_agent"?: string }; Returns: string
                           },
"upsert_person_sensitive":
{ Args: { "p_ambulance_cover": string,"p_emergency_name": string,"p_emergency_phone": string,"p_emergency_relationship": string,"p_medical": string,"p_person_id": string }; Returns: undefined
                           }
          }
          Enums: {
            "age_rule_mode": "birth_year"|"age_at_date","availability_status": "in"|"out"|"unknown","clearance_kind": "wwcc","club_role": "admin"|"coach"|"parent"|"player","club_status": "onboarding"|"active"|"suspended"|"closed","event_kind": "game"|"training"|"other","fee_status": "owing"|"partial"|"paid"|"waived","membership_status": "invited"|"active"|"removed","payment_method": "cash"|"bank"|"card"|"stripe"|"other","person_kind": "player"|"guardian"|"staff","plan_key": "starter"|"club"|"association","registration_source": "public_form"|"admin"|"import","registration_status": "new"|"reviewed"|"placed"|"withdrawn","submission_kind": "incident"|"complaint"|"suggestion"|"absence"|"medical_update","submission_status": "new"|"in_progress"|"closed","subscription_status": "trialing"|"active"|"past_due"|"cancelled"|"unpaid"|"paused","task_status": "open"|"done","theme_pref": "dark"|"light"|"system"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "age_rule_mode": ["birth_year", "age_at_date"],"availability_status": ["in", "out", "unknown"],"clearance_kind": ["wwcc"],"club_role": ["admin", "coach", "parent", "player"],"club_status": ["onboarding", "active", "suspended", "closed"],"event_kind": ["game", "training", "other"],"fee_status": ["owing", "partial", "paid", "waived"],"membership_status": ["invited", "active", "removed"],"payment_method": ["cash", "bank", "card", "stripe", "other"],"person_kind": ["player", "guardian", "staff"],"plan_key": ["starter", "club", "association"],"registration_source": ["public_form", "admin", "import"],"registration_status": ["new", "reviewed", "placed", "withdrawn"],"submission_kind": ["incident", "complaint", "suggestion", "absence", "medical_update"],"submission_status": ["new", "in_progress", "closed"],"subscription_status": ["trialing", "active", "past_due", "cancelled", "unpaid", "paused"],"task_status": ["open", "done"],"theme_pref": ["dark", "light", "system"]
          }
        }
} as const

