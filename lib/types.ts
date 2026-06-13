export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  is_admin: boolean
  created_at: string
  updated_at: string
}

export interface Kit {
  id: string
  title: string
  description: string | null
  music_url: string | null
  music_path: string | null
  music_title: string | null
  story_text: string | null
  video_url: string | null
  character_name: string | null
  character_description: string | null
  character_image_url: string | null
  guide_text: string | null
  cover_image_url: string | null
  is_active: boolean
  price: number | null
  stripe_product_id: string | null
  stripe_price_id: string | null
  created_at: string
  updated_at: string
}

export interface UserKit {
  id: string
  user_id: string
  kit_id: string
  purchased_at: string
  kit?: Kit
}
