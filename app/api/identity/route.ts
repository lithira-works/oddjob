import { NextResponse } from "next/server";
import { DOC_TYPES, MAX_REQUEST_BYTES, normaliseIdNumber, validateIdentity } from "@/lib/identity";
import { hashIdNumber, rebuildImage } from "@/lib/identity-store";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { isSameSite } from "@/lib/request-guard";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";

const BUCKET = "id-documents";
const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

/**
 * Receives an identity check. Closed until ID_CHECKS_OPEN=true, which needs real accounts, a privacy
 * policy and a review process first. See docs/SECURITY.md. Never log anything from this route.
 */
export async function POST(request: Request) {
  if (!isSameSite(request.headers)) return fail("Not allowed", 403);
  if (process.env.ID_CHECKS_OPEN !== "true" || !process.env.ID_HASH_SECRET) return fail("ID checks are not open yet", 503);

  const limit = rateLimit(clientKey(request.headers, "identity"), 5, 60 * 60_000);
  if (!limit.allowed) return fail("Too many requests", 429);

  const length = Number(request.headers.get("content-length"));
  if (!length) return fail("Length required", 411);
  if (length > MAX_REQUEST_BYTES) return fail("Too large", 413);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data")) return fail("Wrong format", 415);

  // Who this is comes from the session, never from the form.
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return fail("Sign in first", 401);
  const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", auth.user.id).single();
  if (!profile) return fail("Sign in first", 401);

  const form = await request.formData().catch(() => null);
  if (!form) return fail("Invalid request", 400);

  const result = validateIdentity(
    { legalName: form.get("legalName"), docType: form.get("docType"), idNumber: form.get("idNumber") },
    profile.display_name as string,
  );
  if (!result.ok) return NextResponse.json({ errors: result.errors }, { status: 422 });
  const { legalName, docType, idNumber } = result.data;

  if (form.get("consent") !== "yes") return fail("Consent is required", 422);

  const slots = ["front", ...(DOC_TYPES[docType].back ? ["back"] : []), "selfie"];
  const images: Record<string, Buffer> = {};
  for (const slot of slots) {
    const file = form.get(slot);
    const rebuilt = file instanceof File ? await rebuildImage(new Uint8Array(await file.arrayBuffer())) : null;
    if (!rebuilt) return fail(`The ${slot} photo couldn't be read`, 422);
    images[slot] = rebuilt;
  }

  const admin = supabaseAdmin();
  const paths: Record<string, string> = {};
  const removeUploads = () => admin.storage.from(BUCKET).remove(Object.values(paths));

  try {
    for (const slot of slots) {
      const path = `${auth.user.id}/${crypto.randomUUID()}.jpg`;
      const { error } = await admin.storage.from(BUCKET).upload(path, images[slot]!, { contentType: "image/jpeg" });
      if (error) throw new Error("upload failed");
      paths[slot] = path;
    }
    const number = normaliseIdNumber(idNumber);
    const { error } = await admin.from("identity_checks").insert({
      user_id: auth.user.id,
      doc_type: docType,
      legal_name: legalName,
      id_number_hmac: hashIdNumber(docType, number, process.env.ID_HASH_SECRET),
      id_last4: number.slice(-4),
      front_path: paths.front,
      back_path: paths.back ?? null,
      selfie_path: paths.selfie,
    });
    if (error) {
      await removeUploads();
      // 23505: this ID or this account already has a check. Same answer for both, to reveal nothing.
      return error.code === "23505"
        ? fail("This ID can’t be used for a new check. Contact us if you think that’s wrong.", 409)
        : fail("We couldn’t save your check. Please try again.", 503);
    }
  } catch {
    await removeUploads();
    return fail("We couldn’t save your check. Please try again.", 503);
  }
  return NextResponse.json({ status: "pending" }, { status: 201 });
}
