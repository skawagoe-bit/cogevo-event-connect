"use server"

import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'

const eventSchema = z.object({
  name: z.string().min(1, 'イベント名は必須です'),
  event_date: z.string(),
  attributes_preset: z.array(z.string()).optional(),
  segments_preset: z.array(z.string()).optional(),
  roles_preset: z.array(z.string()).optional(),
  email_subject: z.string().optional(),
  email_body: z.string().optional(),
})

export async function createEvent(formData: FormData) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('認証が必要です')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // ユーザーIDの取得 (Clerk ID -> Supabase User ID)
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .single()

    if (userError || !user) throw new Error('ユーザー情報の取得に失敗しました')

    const rawData = {
      name: formData.get('name'),
      event_date: formData.get('event_date'),
      attributes_preset: formData.get('attributes_preset') 
        ? JSON.parse(formData.get('attributes_preset') as string)
        : undefined,
      segments_preset: formData.get('segments_preset')
        ? JSON.parse(formData.get('segments_preset') as string)
        : undefined,
      roles_preset: formData.get('roles_preset')
        ? JSON.parse(formData.get('roles_preset') as string)
        : undefined,
      email_subject: formData.get('email_subject'),
      email_body: formData.get('email_body'),
    }

    const validated = eventSchema.parse(rawData)

    const { data, error } = await supabase
      .from('events')
      .insert({
        name: validated.name,
        event_date: validated.event_date,
        user_id: user.id,
        attributes_preset: validated.attributes_preset,
        segments_preset: validated.segments_preset,
        roles_preset: validated.roles_preset,
        email_subject: validated.email_subject,
        email_body: validated.email_body,
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    console.error('Create event error:', error)
    return { success: false, error: error.message }
  }
}

export async function updateEvent(id: string, formData: FormData) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('認証が必要です')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const rawData = {
      name: formData.get('name'),
      event_date: formData.get('event_date'),
      attributes_preset: formData.get('attributes_preset') 
        ? JSON.parse(formData.get('attributes_preset') as string)
        : undefined,
      segments_preset: formData.get('segments_preset')
        ? JSON.parse(formData.get('segments_preset') as string)
        : undefined,
      roles_preset: formData.get('roles_preset')
        ? JSON.parse(formData.get('roles_preset') as string)
        : undefined,
      email_subject: formData.get('email_subject'),
      email_body: formData.get('email_body'),
    }

    const validated = eventSchema.parse(rawData)

    const { data, error } = await supabase
      .from('events')
      .update({
        name: validated.name,
        event_date: validated.event_date,
        attributes_preset: validated.attributes_preset,
        segments_preset: validated.segments_preset,
        roles_preset: validated.roles_preset,
        email_subject: validated.email_subject,
        email_body: validated.email_body,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    console.error('Update event error:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteEvent(id: string) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('認証が必要です')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id)

    if (error) throw error

    return { success: true }
  } catch (error: any) {
    console.error('Delete event error:', error)
    return { success: false, error: error.message }
  }
}

export async function getEventsByMonth(yearMonth: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error('認証が必要です');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // yearMonth is "YYYY-MM"
    const [year, month] = yearMonth.split('-').map(Number);
    
    // Calculate start and end of the month
    // Note: Creating date in local time then converting to ISO might shift the day if not careful.
    // However, for simple date string comparison (YYYY-MM-DD), constructing strings is safer.
    
    const startDate = `${yearMonth}-01`;
    // Last day of month calculation
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${yearMonth}-${lastDay}`;

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .gte('event_date', startDate)
      .lte('event_date', endDate)
      .order('event_date', { ascending: true });

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    console.error('Get events by month error:', error);
    return { success: false, error: error.message || 'イベントの取得に失敗しました' };
  }
}

export async function getAllEvents() {
    try {
      const { userId } = await auth();
      if (!userId) throw new Error('認証が必要です');
  
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
  
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: false });
  
      if (error) throw error;
  
      return { success: true, data };
    } catch (error: any) {
      console.error('Get all events error:', error);
      return { success: false, error: error.message || 'イベントの取得に失敗しました' };
    }
  }
