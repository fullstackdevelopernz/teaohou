export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://owdqszafcfiwpszcijus.supabase.co';
export const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? 'sb_publishable_7ZLEPsvPN0Ilzb0Td9hAdw_FB1rNwYv';

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error('Te Ao Hou Supabase configuration is missing.');
}
