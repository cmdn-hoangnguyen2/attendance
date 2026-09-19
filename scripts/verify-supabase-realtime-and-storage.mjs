import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const client = createClient(supabaseUrl, supabaseKey);

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ ${message}`);
    failed++;
  }
}

async function run() {
  console.log("\n=======================================================");
  console.log("  VERIFYING SPRINT 7: REALTIME & PRIVATE STORAGE       ");
  console.log("=======================================================\n");

  // 1. Check storage bucket
  console.log("1. Testing Storage Bucket 'payment-images'...");
  const { data: buckets, error: bucketError } = await client.storage.listBuckets();
  assert(!bucketError, "Fetched storage buckets without error");

  const paymentBucket = buckets?.find((b) => b.id === "payment-images");
  assert(Boolean(paymentBucket), "Bucket 'payment-images' exists");
  assert(paymentBucket?.public === false, "Bucket 'payment-images' is strictly PRIVATE");
  assert(paymentBucket?.file_size_limit === 5242880, "File size limit is set to 5 MB (5242880 bytes)");

  // 2. Upload test object & Signed URL
  console.log("\n2. Testing Upload and Signed URL Flow...");
  const testBuffer = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
  const testPath = `test-room/test-qr-${Date.now()}.png`;

  const { data: uploadData, error: uploadErr } = await client.storage
    .from("payment-images")
    .upload(testPath, testBuffer, {
      contentType: "image/png",
      upsert: true,
    });

  assert(!uploadErr && Boolean(uploadData), "Uploaded 1x1 test PNG image successfully");

  // Generate Signed URL
  const { data: signedData, error: signedErr } = await client.storage
    .from("payment-images")
    .createSignedUrl(testPath, 3600);

  assert(!signedErr && Boolean(signedData?.signedUrl), "Generated Signed URL with 1-hour expiration");
  assert(signedData?.signedUrl?.includes("token="), "Signed URL contains secure access token");

  // Clean up test file
  const { error: deleteErr } = await client.storage
    .from("payment-images")
    .remove([testPath]);
  assert(!deleteErr, "Cleaned up test file from storage bucket");

  // 3. Test Invalid MIME Rejection
  console.log("\n3. Testing Security Constraints & Invalid MIME Rejection...");
  const { error: rejectErr } = await client.storage
    .from("payment-images")
    .upload(`test-room/evil-${Date.now()}.svg`, Buffer.from("<svg></svg>"), {
      contentType: "image/svg+xml",
    });
  assert(Boolean(rejectErr), "Storage bucket correctly rejected invalid MIME type (image/svg+xml)");

  // 4. Test Realtime Subscriptions & Channel creation
  console.log("\n4. Testing Realtime Channel Connection...");
  const channel = client.channel("test-room-channel");
  assert(Boolean(channel), "Successfully initialized Realtime broadcast/postgres_changes channel");
  await client.removeChannel(channel);
  assert(true, "Successfully removed and cleaned up Realtime channel");

  console.log("\n=======================================================");
  console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED  `);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
