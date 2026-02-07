'use server';

import { auth, clerkClient } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

export async function inviteUser(email: string) {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Clerk招待の送信
    try {
        const client = await clerkClient()
        await client.invitations.createInvitation({
            emailAddress: email,
            redirectUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
            ignoreExisting: true // 既に招待済みでもエラーにしない（再送扱いになる場合がある）
        })
    } catch (e: any) {
        // Clerk側でエラーが出ても、DBへの追加は試みる（手動登録のため）
        // ただし、既に登録済みユーザーの場合はエラーになる
        console.error("Clerk invitation error:", e);
        if (e.errors && e.errors[0]?.code === 'form_identifier_exists') {
             return { success: false, error: 'このメールアドレスは既にClerkに登録されています' }
        }
    }

    // Add to allowed_users
    const { error } = await supabase
        .from('allowed_users')
        .insert({ 
            email: email,
            invited_at: new Date().toISOString(),
            role: 'user'
        })
    
    if (error) {
        if (error.code === '23505') { // Unique violation
            // DBにはあるがClerk招待を再送したいケースもありうるので、ここは成功扱いにするか、
            // 別途resendInvitationを作る。
            // ここでは「既にリストにいます」と返す
            return { success: false, error: 'このメールアドレスは既に許可リストに登録されています' }
        }
        return { success: false, error: error.message }
    }

    revalidatePath('/admin/users')
    return { success: true }
}

export async function resendInvitation(email: string) {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    try {
        const client = await clerkClient()
        // 既存の招待を確認
        const invitations = await client.invitations.getInvitationList({ status: ['pending'] });
        const existingInvite = invitations.data.find(inv => inv.emailAddress === email);

        if (existingInvite) {
            // 既存の招待を取り消して再作成（リセンド機能が直接ないため）
            await client.invitations.revokeInvitation(existingInvite.id);
        }

        // 新規招待作成（これが再送になる）
        await client.invitations.createInvitation({
            emailAddress: email,
            redirectUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
            ignoreExisting: true
        })
        return { success: true }
    } catch (e: any) {
        console.error("Resend error:", e);
        return { success: false, error: e.errors ? e.errors[0].message : '招待の再送に失敗しました' }
    }
}

export async function getAllowedUsers() {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: dbUsers, error } = await supabase
        .from('allowed_users')
        .select('*')
        .order('invited_at', { ascending: false })

    if (error) throw error

    // Clerk側のステータスを取得してマージ
    const client = await clerkClient()
    
    // N+1問題を避けるため、本来は一括取得すべきだが、管理画面かつ人数が少ない前提でループ処理
    const usersWithStatus = await Promise.all(dbUsers.map(async (user) => {
        let status = '未登録';
        try {
            // まずユーザーとして存在するか確認
            const clerkUsers = await client.users.getUserList({ emailAddress: [user.email] });
            if (clerkUsers.data.length > 0) {
                status = '登録完了';
            } else {
                // 招待中か確認
                const invitations = await client.invitations.getInvitationList({ status: ['pending'] });
                const invite = invitations.data.find(inv => inv.emailAddress === user.email);
                if (invite) {
                    status = '招待中';
                }
            }
        } catch (e) {
            console.error("Status check error", e);
            status = '不明';
        }
        return { ...user, status };
    }));

    return usersWithStatus
}

export async function removeAllowedUser(email: string) {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Clerkからも削除
    const client = await clerkClient()
    try {
        // ユーザー削除
        const clerkUsers = await client.users.getUserList({ emailAddress: [email] });
        if (clerkUsers.data.length > 0) {
            await client.users.deleteUser(clerkUsers.data[0].id);
        }
        
        // 招待削除
        const invitations = await client.invitations.getInvitationList({ status: ['pending'] });
        const invite = invitations.data.find(inv => inv.emailAddress === email);
        if (invite) {
            await client.invitations.revokeInvitation(invite.id);
        }
    } catch (e) {
        console.error("Clerk delete error:", e);
        // Clerk削除に失敗してもDBからは消すか？ -> 消すべき
    }

    const { error } = await supabase
        .from('allowed_users')
        .delete()
        .eq('email', email)

    if (error) return { success: false, error: error.message }
    revalidatePath('/admin/users')
    return { success: true }
}
