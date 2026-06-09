import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminClubIds, isMasterAdmin } from '@/lib/clubs'

const f = createUploadthing()

export const ourFileRouter = {
  pdfTemplateUpload: f({ pdf: { maxFileSize: '16MB' } })
    .middleware(async () => {
      const { userId } = await auth()
      if (!userId) throw new Error('Unauthorized')

      const [isMaster, adminClubIds] = await Promise.all([isMasterAdmin(userId), getAdminClubIds(userId)])

      if (!isMaster && adminClubIds.length === 0) throw new Error('Forbidden')

      return { userId }
    })
    .onUploadComplete(async ({ metadata }) => {
      return { uploadedBy: metadata.userId }
    }),

  templatePreviewUpload: f({ image: { maxFileSize: '4MB' } })
    .middleware(async () => {
      const { userId } = await auth()
      if (!userId) throw new Error('Unauthorized')

      const [isMaster, adminClubIds] = await Promise.all([isMasterAdmin(userId), getAdminClubIds(userId)])

      if (!isMaster && adminClubIds.length === 0) throw new Error('Forbidden')

      return { userId }
    })
    .onUploadComplete(async ({ metadata }) => {
      return { uploadedBy: metadata.userId }
    }),

  fontFileUpload: f({ blob: { maxFileSize: '4MB' } })
    .middleware(async () => {
      const { userId } = await auth()
      if (!userId) throw new Error('Unauthorized')

      const supabase = createAdminClient()
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .single()

      if (!profile?.is_admin) throw new Error('Forbidden')

      return { userId }
    })
    .onUploadComplete(async ({ metadata }) => {
      return { uploadedBy: metadata.userId }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
