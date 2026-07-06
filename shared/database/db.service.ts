import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable.");
}
if (!supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable.");
}

console.log("[db.service] Supabase URL:", supabaseUrl ? "Set" : "Not Set");
console.log("[db.service] Supabase Anon Key:", supabaseAnonKey ? "Set" : "Not Set");

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function saveSubmission(id: string, data: any): Promise<void> {
  try {
    console.log(`[db.service] Saving submission with ID: ${id}, Data keys: ${Object.keys(data).join(', ')}`);

    // Check if the submission already exists
    const existingSubmission = await getSubmission(id);
    if (existingSubmission) {
      console.log(`[db.service] Submission with ID ${id} already exists. Performing UPDATE.`);
    } else {
      console.log(`[db.service] Submission with ID ${id} does not exist. Performing INSERT.`);
    }
    const { data: returnedData, error } = await supabase
      .from('submissions')
      .upsert({ id: id, data: data }, { onConflict: 'id' }); // Upsert by ID

    console.log("[db.service] Returned Data:", returnedData);

    if (error) {
      console.error("[db.service] Supabase save error:");
      console.error("Code:", error.code);
      console.error("Message:", error.message);
      console.error("Details:", error.details);
      console.error("Hint:", error.hint);
      console.error("Full Error:", error);
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
    const { data: returnedData, error } = await supabase
      .from('submissions')
      .select('data') // Select only the 'data' column
      .eq('id', id)
      .single();

    console.log("[db.service] Returned Data:", returnedData);

    if (error && error.code !== 'PGRST116') { // PGRST116 is Supabase's "No rows found" error code
      console.error("[db.service] Supabase retrieve error:");
      console.error("Code:", error.code);
      console.error("Message:", error.message);
      console.error("Details:", error.details);
      console.error("Hint:", error.hint);
      console.error("Full Error:", error);
      throw error;
    }

    console.log("[db.service] Supabase query data:", returnedData);
    console.log("[db.service] Supabase query error:", error);

    return returnedData ? returnedData.data : null; // Return the content of the 'data' JSONB column
  } catch (err) {
    console.error("[db.service] Failed to retrieve submission from Supabase:", err);
    return null;
  }
}
