export type ClaimStatus = 'pending' | 'approved' | 'rejected'

export type CertificateClaim = {
  id: string
  user_id: string
  status: ClaimStatus
  admin_feedback: string | null
  created_at: string
  updated_at: string
}
