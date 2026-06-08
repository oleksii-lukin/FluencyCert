"use client"

async function deleteClub(clubSlug: string) {
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const supabase = createAdminClient()
  await supabase.from('speaking_clubs').delete().eq('slug', clubSlug)
}

export function DeleteClubButton({ clubSlug, label }: { clubSlug: string; label: string }) {
  return (
    <form
      action={async () => deleteClub(clubSlug)}
    >
      <button
        type="submit"
        className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
        onClick={(e) => {
          if (!confirm('Are you sure you want to delete this club? This cannot be undone.')) {
            e.preventDefault()
          }
        }}
      >
        {label}
      </button>
    </form>
  )
}
