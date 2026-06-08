export type ClaimStatus = 'pending' | 'approved' | 'rejected'

export type CertificateClaim = {
  id: string
  user_id: string
  slug: string
  status: ClaimStatus
  admin_feedback: string | null
  approved_at: string | null
  english_level: string | null
  speaking_clubs_count: number | null
  hours_participated: number | null
  background_template: string | null
  created_at: string
  updated_at: string
}

export type FeedbackStatus = 'pending' | 'approved' | 'rejected'

export type DisplayNamePreference = 'nickname' | 'full_name'

export type CertificateFeedback = {
  id: string
  certificate_id: string
  reviewer_id: string
  feedback_text: string
  display_name_preference: DisplayNamePreference
  linkedin_url: string | null
  status: FeedbackStatus
  sort_order: number
  is_visible: boolean
  created_at: string
  updated_at: string
}

export type CertificateUpvote = {
  id: string
  certificate_id: string
  user_id: string
  created_at: string
}
