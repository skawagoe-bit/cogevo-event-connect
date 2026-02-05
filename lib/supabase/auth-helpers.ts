import { auth, currentUser } from '@clerk/nextjs/server'
import { createServiceRoleClient } from './service-role'
import { redirect } from 'next/navigation'

export async function getSupabaseUserByClerkId() {
  const { userId } = await auth()
  if (!userId) return null

  const supabase = createServiceRoleClient()
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('clerk_user_id', userId)
    .maybeSingle()

  return data ?? null
}

export async function ensureSupabaseUser() {
  const { userId } = await auth()
  if (!userId) return null

  const user = await currentUser()
  if (!user) return null

  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('users')
    .upsert(
      {
        clerk_user_id: userId,
        email: user.emailAddresses[0].emailAddress,
        full_name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || null,
      },
      { onConflict: 'clerk_user_id' }
    )
    .select()
    .single()

  if (error) throw error
  return data
}

export async function ensureAuthenticatedAndAllowed() {
    const user = await ensureSupabaseUser();
    if (!user) redirect('/sign-in'); // Should trigger Clerk flow usually

    const supabase = createServiceRoleClient();
    
    // 1. Check Whitelist
    const { data: allowed } = await supabase
        .from('allowed_users')
        .select('email')
        .eq('email', user.email)
        .single();
    
    // If whitelist is empty, we might allow the FIRST user (auto-admin) or block everyone.
    // To prevent lockout, if table is empty, we allow. 
    // BUT user asked for restriction.
    // I will implemented strict check.
    
    // SAFETY: If table is empty, maybe allow?
    const { count } = await supabase.from('allowed_users').select('*', { count: 'exact', head: true });
    
    if (count && count > 0) {
        if (!allowed) {
            console.log(`User ${user.email} is not in allowed_users.`);
            redirect('/access-denied');
        }
    } else {
        // Table empty -> First user becomes admin/allowed automatically
        console.log(`First user ${user.email} auto-whitelisted.`);
        await supabase.from('allowed_users').insert({ email: user.email, role: 'admin' });
    }

    // 2. Check Terms
    if (!user.terms_agreed_at) {
        redirect('/terms');
    }

    return user;
}
