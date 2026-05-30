import { createClient } from 'npm:@supabase/supabase-js'
import { verifyWebhook } from 'npm:@clerk/backend/webhooks'

Deno.serve(async (req) => {
  const webhookSecret = Deno.env.get('CLERK_WEBHOOK_SECRET')

  if (!webhookSecret) {
    console.error('CLERK_WEBHOOK_SECRET not configured')
    return new Response('Webhook secret not configured', { status: 500 })
  }

  let event
  try {
    event = await verifyWebhook(req, { signingSecret: webhookSecret })
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return new Response('Invalid webhook signature', { status: 401 })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Supabase credentials not configured')
    return new Response('Supabase credentials not configured', { status: 500 })
  }
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  switch (event.type) {
    case 'user.created': {
      const email = event.data.email_addresses?.[0]?.email_address ?? ''
      const { error } = await supabase.from('profiles').insert({
        id: event.data.id,
        email,
        first_name: event.data.first_name,
        last_name: event.data.last_name,
        username: event.data.username,
        phone_number: event.data.phone_numbers?.[0]?.phone_number ?? null,
        avatar_url: event.data.image_url,
        linkedin_url: event.data.public_metadata?.linkedin_url ?? null,
      })

      if (error) {
        console.error('Error creating profile:', error)
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
      }

      return new Response(JSON.stringify({ success: true }), { status: 200 })
    }

    case 'user.updated': {
      const email = event.data.email_addresses?.[0]?.email_address ?? ''
      const { error } = await supabase.from('profiles').update({
        email,
        first_name: event.data.first_name,
        last_name: event.data.last_name,
        username: event.data.username,
        phone_number: event.data.phone_numbers?.[0]?.phone_number ?? null,
        avatar_url: event.data.image_url,
        linkedin_url: event.data.public_metadata?.linkedin_url ?? null,
      }).eq('id', event.data.id)

      if (error) {
        console.error('Error updating profile:', error)
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
      }

      return new Response(JSON.stringify({ success: true }), { status: 200 })
    }

    case 'user.deleted': {
      const { error } = await supabase.from('profiles').delete().eq('id', event.data.id)

      if (error) {
        console.error('Error deleting profile:', error)
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
      }

      return new Response(JSON.stringify({ success: true }), { status: 200 })
    }

    default: {
      console.log('Unhandled event type:', event.type)
      return new Response(JSON.stringify({ success: true }), { status: 200 })
    }
  }
})
