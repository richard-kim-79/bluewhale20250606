export interface Profile {
  id: string;
  email: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
  is_writer: boolean;
  created_at: string;
}

export interface Newsletter {
  id: string;
  writer_id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  is_paid: boolean;
  price_monthly: number;
  created_at: string;
  // joined
  writer?: Profile;
  subscriber_count?: number;
}

export interface Post {
  id: string;
  newsletter_id: string;
  writer_id: string;
  title: string;
  content: string;
  excerpt: string | null;
  is_premium: boolean;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  // joined
  newsletter?: Newsletter;
  writer?: Profile;
}

export interface Subscription {
  id: string;
  subscriber_id: string;
  newsletter_id: string;
  is_paid: boolean;
  status: "active" | "cancelled" | "expired";
  created_at: string;
  expires_at: string | null;
  // joined
  subscriber?: Profile;
  newsletter?: Newsletter;
}

export interface Payment {
  id: string;
  subscription_id: string;
  subscriber_id: string;
  amount: number;
  payment_key: string | null;
  order_id: string;
  status: "ready" | "done" | "cancelled";
  paid_at: string | null;
}

// Supabase Database type
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          email: string;
          name: string;
          bio?: string | null;
          avatar_url?: string | null;
          is_writer?: boolean;
        };
        Update: Partial<Omit<Profile, "id" | "created_at">>;
      };
      newsletters: {
        Row: Newsletter;
        Insert: {
          writer_id: string;
          title: string;
          description?: string | null;
          cover_image_url?: string | null;
          is_paid?: boolean;
          price_monthly?: number;
        };
        Update: Partial<Omit<Newsletter, "id" | "writer_id" | "created_at">>;
      };
      posts: {
        Row: Post;
        Insert: {
          newsletter_id: string;
          writer_id: string;
          title: string;
          content?: string;
          excerpt?: string | null;
          is_premium?: boolean;
          is_published?: boolean;
          published_at?: string | null;
        };
        Update: Partial<Omit<Post, "id" | "newsletter_id" | "writer_id" | "created_at">>;
      };
      subscriptions: {
        Row: Subscription;
        Insert: {
          subscriber_id: string;
          newsletter_id: string;
          is_paid?: boolean;
          status?: string;
          expires_at?: string | null;
        };
        Update: Partial<Omit<Subscription, "id" | "created_at">>;
      };
      payments: {
        Row: Payment;
        Insert: {
          subscription_id?: string;
          subscriber_id: string;
          amount: number;
          payment_key?: string | null;
          order_id: string;
          status?: string;
          paid_at?: string | null;
        };
        Update: Partial<Omit<Payment, "id">>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
