import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

console.log("[db.service] Supabase URL:", supabaseUrl ? "Set" : "Not Set");
console.log("[db.service] Supabase Anon Key:", supabaseAnonKey ? "Set" : "Not Set");

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function saveSubmission(id: string, data: any): Promise<void> {
  try {
    console.log(`[db.service] Saving submission with ID: ${id}, Data keys: ${Object.keys(data).join(', ')}`);
    const { error } = await supabase
      .from('submissions')
      .upsert({ id: id, data: data }, { onConflict: 'id' }); // Upsert by ID

    if (error) {
      console.error("[db.service] Supabase save error:", error);
      throw error;
    }
    console.log(`[db.service] Successfully saved submission with ID: ${id}`);
  } catch (err) {
    console.error("[db.service] Failed to save submission to Supabase:", err);
    throw err;
  }
}

export async function getSubmission(id: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('submissions')
      .select('data') // Select only the 'data' column
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is Supabase's "No rows found" error code
      console.error("[db.service] Supabase retrieve error:", error);
      throw error;
    }

    console.log("[db.service] Supabase query data:", data);
    console.log("[db.service] Supabase query error:", error);

    return data ? data.data : null; // Return the content of the 'data' JSONB column
  } catch (err) {
    console.error("[db.service] Failed to retrieve submission from Supabase:", err);
    return null;
  }
}
