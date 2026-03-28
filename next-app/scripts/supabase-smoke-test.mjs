import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

function readEnvFile(filePath) {
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  const entries = lines
    .filter((line) => line && !line.trim().startsWith("#") && line.includes("="))
    .map((line) => {
      const separatorIndex = line.indexOf("=");
      return [line.slice(0, separatorIndex), line.slice(separatorIndex + 1)];
    });

  return Object.fromEntries(entries);
}

const env = readEnvFile(new URL("../.env.local", import.meta.url));
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
  throw new Error("Missing required env values for smoke test");
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const client = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const timestamp = Date.now();
const email = `smoke-${timestamp}@example.com`;
const password = `Trace!${timestamp}`;
let userId = null;

async function cleanup() {
  if (!userId) {
    return;
  }

  await admin.from("projects").delete().eq("owner_id", userId);
  await admin.auth.admin.deleteUser(userId);
}

try {
  const { data: createdUser, error: createUserError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: "Smoke Test User",
    },
  });

  if (createUserError) {
    throw createUserError;
  }

  userId = createdUser.user.id;

  const { error: signInError } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    throw signInError;
  }

  const { data: authUserData, error: authUserError } = await client.auth.getUser();

  if (authUserError) {
    throw authUserError;
  }

  if (!authUserData.user) {
    throw new Error("No authenticated user returned by signInWithPassword");
  }

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("id, full_name")
    .eq("id", authUserData.user.id)
    .single();

  if (profileError) {
    throw profileError;
  }

  const { error: insertError } = await client.from("projects").insert({
    owner_id: authUserData.user.id,
    name: "Automated Smoke Project",
    status: "draft",
    metadata: {
      source: "terminal-smoke-test",
    },
  });

  if (insertError) {
    throw insertError;
  }

  const { data: projects, error: projectsError } = await client
    .from("projects")
    .select("name, owner_id, status")
    .eq("owner_id", authUserData.user.id);

  if (projectsError) {
    throw projectsError;
  }

  console.log("AUTH_QUERY_SMOKE_OK");
  console.log(
    JSON.stringify({
      userId: authUserData.user.id,
      profileLoaded: Boolean(profile),
      projectsFound: projects.length,
    }),
  );

  await client.auth.signOut();
  await cleanup();
} catch (error) {
  console.error("AUTH_QUERY_SMOKE_FAIL");
  console.error(error instanceof Error ? error.message : String(error));
  await cleanup();
  process.exit(1);
}
