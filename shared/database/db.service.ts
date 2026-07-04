import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY as string;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function saveSubmission(id: string, data: any): Promise<void> {
  try {
    const { error } = await supabase
      .from('submissions')
      .upsert({ id: id, data: data }, { onConflict: 'id' }); // Upsert by ID

    if (error) {
      console.error("[db.service] Supabase save error:", error);
      throw error;
    }
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

    return data ? data.data : null; // Return the content of the 'data' JSONB column
  } catch (err) {
    console.error("[db.service] Failed to retrieve submission from Supabase:", err);
    return null;
  }
}
