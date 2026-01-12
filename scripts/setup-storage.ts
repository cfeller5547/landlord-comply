import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  console.log("\nTo get your service role key:");
  console.log("1. Go to https://supabase.com/dashboard/project/txziykaoatbqvihveasu/settings/api");
  console.log("2. Copy the 'service_role' key (keep it secret!)");
  console.log("3. Add it to your .env file as SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

async function setupStorage() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log("Setting up Supabase Storage buckets...\n");

  // Create case-files bucket for documents and attachments
  const { data: bucket, error: bucketError } = await supabase.storage.createBucket(
    "case-files",
    {
      public: false, // Files require authentication to access
      fileSizeLimit: 10485760, // 10MB max file size
      allowedMimeTypes: [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/heic",
      ],
    }
  );

  if (bucketError) {
    if (bucketError.message.includes("already exists")) {
      console.log("✓ Bucket 'case-files' already exists");
    } else {
      console.error("✗ Error creating bucket:", bucketError.message);
      return;
    }
  } else {
    console.log("✓ Created bucket 'case-files'");
  }

  // Set up storage policies
  // Policy: Users can only access their own files
  const policies = [
    {
      name: "Users can upload their own files",
      definition: `(bucket_id = 'case-files' AND auth.uid()::text = (storage.foldername(name))[2])`,
      operation: "INSERT" as const,
    },
    {
      name: "Users can view their own files",
      definition: `(bucket_id = 'case-files' AND auth.uid()::text = (storage.foldername(name))[2])`,
      operation: "SELECT" as const,
    },
    {
      name: "Users can delete their own files",
      definition: `(bucket_id = 'case-files' AND auth.uid()::text = (storage.foldername(name))[2])`,
      operation: "DELETE" as const,
    },
  ];

  console.log("\nNote: Storage policies should be configured in the Supabase dashboard.");
  console.log("Go to: https://supabase.com/dashboard/project/txziykaoatbqvihveasu/storage/policies");
  console.log("\nRecommended policy structure:");
  console.log("- Files should be stored as: documents/{user_id}/{case_id}/{filename}");
  console.log("- Users should only access files in their own user_id folder");

  console.log("\n✓ Storage setup complete!");
}

setupStorage().catch(console.error);
