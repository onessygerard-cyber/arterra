import { supabaseAdmin } from '@/lib/supabase-admin';

export async function confirmedSeats(experienceId: string, excludeBookingId?: string): Promise<number> {
  const { data } = await supabaseAdmin
    .from('experience_bookings')
    .select('id, seats')
    .eq('experience_id', experienceId)
    .eq('status', 'confirmed');

  return (data || [])
    .filter((row: { id: string }) => row.id !== excludeBookingId)
    .reduce((sum: number, row: { seats: number }) => sum + row.seats, 0);
}