import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function AdminDashboard() {
  const { userId } = await auth()
  const supabase = createAdminClient()

  const [{ count: totalUsers }, { count: adminUsers }, { count: pendingClaims }] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_admin', true),
    supabase.from('certificate_claims').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-4">
        <div className="rounded-xl border p-6">
          <p className="text-sm text-muted-foreground">Total Users</p>
          <p className="text-3xl font-bold mt-1">{totalUsers ?? 0}</p>
        </div>
        <div className="rounded-xl border p-6">
          <p className="text-sm text-muted-foreground">Admins</p>
          <p className="text-3xl font-bold mt-1">{adminUsers ?? 0}</p>
        </div>
        <div className="rounded-xl border p-6">
          <p className="text-sm text-muted-foreground">Pending Claims</p>
          <p className="text-3xl font-bold mt-1 text-amber-600">{pendingClaims ?? 0}</p>
        </div>
        <div className="rounded-xl border p-6">
          <p className="text-sm text-muted-foreground">Signed in as</p>
          <p className="text-sm font-mono mt-1 truncate">{userId}</p>
        </div>
      </div>
    </div>
  )
}
