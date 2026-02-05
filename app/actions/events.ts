"use server"

import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const eventSchema = z.object({
  name: z.string().min(1, 'イベント名は必須です'),
  name_en: z.string().nullable().optional().or(z.literal('')),
  event_date: z.string(), // This is the START date
  end_date: z.string().nullable().optional().or(z.literal('')), // Added: END date
  attributes_preset: z.array(z.string()).optional(),
  segments_preset: z.array(z.string()).optional(),
  roles_preset: z.array(z.string()).optional(),
  email_templates: z.record(z.any()).optional().or(z.literal({})), 
})

// Helper to parse email templates safely even if nested strings
function parseEmailTemplates(jsonString: string | null): Record<string, unknown> | undefined {
    if (!jsonString) return undefined;
    try {
        const parsed = JSON.parse(jsonString);
        if (parsed && typeof parsed === 'object') {
            const clean: Record<string, unknown> = {};
            Object.keys(parsed).forEach(key => {
                const val = (parsed as Record<string, unknown>)[key];
                if (typeof val === 'string') {
                    try {
                        const inner = JSON.parse(val);
                        if (inner && typeof inner === 'object') {
                            clean[key] = inner;
                        }
                    } catch {
                    }
                } else if (val && typeof val === 'object') {
                    clean[key] = val;
                }
            });
            return clean;
        }
        return parsed;
    } catch (e) {
        console.error("Failed to parse email_templates", e);
        return {};
    }
}

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
      name_en: formData.get('name_en'), 
      event_date: formData.get('event_date'),
      end_date: formData.get('end_date'), // Added
      attributes_preset: formData.get('attributes_preset') 
        ? JSON.parse(formData.get('attributes_preset') as string)
        : undefined,
      segments_preset: formData.get('segments_preset')
        ? JSON.parse(formData.get('segments_preset') as string)
        : undefined,
      roles_preset: formData.get('roles_preset')
        ? JSON.parse(formData.get('roles_preset') as string)
        : undefined,
      email_templates: parseEmailTemplates(formData.get('email_templates') as string | null),
    }

    const validated = eventSchema.parse(rawData)

    const { data, error } = await supabase
      .from('events')
      .insert({
        name: validated.name,
        name_en: validated.name_en || null,
        event_date: validated.event_date,
        end_date: validated.end_date || null, // Added
        user_id: user.id,
        attributes_preset: validated.attributes_preset,
        segments_preset: validated.segments_preset,
        roles_preset: validated.roles_preset,
        email_templates: validated.email_templates || {},
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/preset')
    revalidatePath('/admin/events')
    return { success: true, data }
  } catch (error: unknown) {
    console.error('Create event error:', error)
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg }
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
      name_en: formData.get('name_en'),
      event_date: formData.get('event_date'),
      end_date: formData.get('end_date'), // Added
      attributes_preset: formData.get('attributes_preset') 
        ? JSON.parse(formData.get('attributes_preset') as string)
        : undefined,
      segments_preset: formData.get('segments_preset')
        ? JSON.parse(formData.get('segments_preset') as string)
        : undefined,
      roles_preset: formData.get('roles_preset')
        ? JSON.parse(formData.get('roles_preset') as string)
        : undefined,
      email_templates: parseEmailTemplates(formData.get('email_templates') as string | null),
    }

    const validated = eventSchema.parse(rawData)

    const { data, error } = await supabase
      .from('events')
      .update({
        name: validated.name,
        name_en: validated.name_en || null,
        event_date: validated.event_date,
        end_date: validated.end_date || null, // Added
        attributes_preset: validated.attributes_preset,
        segments_preset: validated.segments_preset,
        roles_preset: validated.roles_preset,
        email_templates: validated.email_templates,
      })
      .eq('id', id)
      .select()
      .maybeSingle() 

    if (error) throw error
    if (!data) throw new Error('イベントが見つかりませんでした (Could not find event)')

    revalidatePath('/preset')
    revalidatePath('/admin/events')
    return { success: true, data }
  } catch (error: unknown) {
    console.error('Update event error:', error)
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg }
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

    revalidatePath('/preset')
    revalidatePath('/admin/events')
    return { success: true }
  } catch (error: unknown) {
    console.error('Delete event error:', error)
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg }
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
    const startDate = `${yearMonth}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${yearMonth}-${lastDay}`;

    const { data, error } = await supabase
      .from('events')
      .select('*')
      // Simple range check on START date. 
      // If event spans across months, we might want to check overlap, 
      // but for simplicity, we check if start date is in month.
      .gte('event_date', startDate)
      .lte('event_date', endDate)
      .order('event_date', { ascending: true });

    if (error) throw error;

    return { success: true, data };
  } catch (error: unknown) {
    console.error('Get events by month error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg || 'イベントの取得に失敗しました' };
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
  } catch (error: unknown) {
    console.error('Get all events error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg || 'イベントの取得に失敗しました' };
  }
}
