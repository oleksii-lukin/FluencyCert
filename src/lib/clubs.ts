import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export interface ClubRole {
  clubId: string
  clubName: string
  clubSlug: string
  role: 'member' | 'admin'
}

export async function getUserClubRoles(userId: string): Promise<ClubRole[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('club_memberships')
    .select('role, speaking_clubs!inner(id, name, slug)')
    .eq('user_id', userId)

  if (!data) return []

  return data.map((m) => ({
    clubId: m.speaking_clubs.id,
    clubName: m.speaking_clubs.name,
    clubSlug: m.speaking_clubs.slug,
    role: m.role as 'member' | 'admin',
  }))
}

export async function isClubAdmin(userId: string, clubId: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('club_memberships')
    .select('id')
    .eq('user_id', userId)
    .eq('club_id', clubId)
    .eq('role', 'admin')
    .maybeSingle()

  return !!data
}

export async function isClubMember(userId: string, clubId: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('club_memberships')
    .select('id')
    .eq('user_id', userId)
    .eq('club_id', clubId)
    .maybeSingle()

  return !!data
}

export async function getAdminClubIds(userId: string): Promise<string[]> {
  const roles = await getUserClubRoles(userId)
  const adminIds: string[] = []
  for (const r of roles) {
    if (r.role === 'admin') adminIds.push(r.clubId)
  }
  return adminIds
}

export async function requireMasterAdmin(userId: string) {
  const supabase = createAdminClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}

export async function requireClubAdminOrMaster(userId: string, clubId: string) {
  const supabase = createAdminClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single()

  if (profile?.is_admin) return null

  const isAdmin = await isClubAdmin(userId, clubId)
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}

export async function isMasterAdmin(userId: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single()

  return data?.is_admin ?? false
}

export async function getClubBySlug(slug: string) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('speaking_clubs')
    .select('*')
    .eq('slug', slug)
    .single()

  return data
}

export async function getClubById(id: string) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('speaking_clubs')
    .select('*')
    .eq('id', id)
    .single()

  return data
}
