import { supabase } from './supabase.js';

export async function fetchAuditLog({ limit = 500 } = {}) {
  try {
    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return { items: Array.isArray(data) ? data : [], error: null };
  } catch (e) {
    return { items: [], error: e };
  }
}

export async function deleteAuditLog(id) {
  const { error } = await supabase.from('audit_log').delete().eq('id', id);
  return { error };
}

export async function deleteAuditLogAll() {
  // delete every row (Supabase requires a filter — use a "not null" trick)
  const { error } = await supabase
    .from('audit_log')
    .delete()
    .not('id', 'is', null);
  return { error };
}
