import { supabase } from '@/lib/supabase'

// 🔹 Send event invitation
export const sendEventInvite = async (eventId, recipientEmail) => {
  const { data, error } = await supabase
    .from('event_invites')
    .insert([{ event_id: eventId, recipient_email: recipientEmail, status: 'pending' }])

  return { data, error }
}

// 🔹 Accept event invitation
export const acceptInvite = async (inviteId) => {
  const { error } = await supabase
    .from('event_invites')
    .update({ status: 'accepted' })
    .eq('id', inviteId)

  return { error }
}
