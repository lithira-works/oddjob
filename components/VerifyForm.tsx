"use client";

import { Camera, Check, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { homeFor } from "@/lib/auth";
import {
  DOC_TYPES, IMAGE_MESSAGES, MAX_IMAGE_BYTES, MIN_IMAGE_SIDE, sniffImage, validateIdentity,
  type DocType, type IdentityErrors,
} from "@/lib/identity";
import { startPreviewSession, usePreviewSession } from "@/lib/preview-session";

type Slot = "front" | "back" | "selfie";
type Stage = "details" | "documents" | "photo" | "done";
type Picked = { file: File; url: string };

const STAGES: { id: Exclude<Stage, "done">; label: string }[] = [
  { id: "details", label: "Your details" },
  { id: "documents", label: "Your ID" },
  { id: "photo", label: "Your photo" },
];

async function checkImage(file: File): Promise<string | null> {
  if (file.size > MAX_IMAGE_BYTES) return IMAGE_MESSAGES.size;
  if (!sniffImage(new Uint8Array(await file.slice(0, 16).arrayBuffer()))) return IMAGE_MESSAGES.type;
  try {
    const bitmap = await createImageBitmap(file);
    const side = Math.min(bitmap.width, bitmap.height);
    bitmap.close();
    return side < MIN_IMAGE_SIDE ? IMAGE_MESSAGES.small : null;
  } catch {
    return IMAGE_MESSAGES.type;
  }
}

function PhotoField({ slot, label, note, picked, error, selfie, onPick }: {
  slot: Slot; label: string; note: string; picked?: Picked; error?: string; selfie?: boolean; onPick: (slot: Slot, file: File | null) => void;
}) {
  return (
    <div className="photo">
      <label className={`photo__drop ${picked ? "is-set" : ""}`}>
        {/* No name attribute: in this preview a photo can't be submitted, even without script. */}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture={selfie ? "user" : undefined}
          onChange={(e) => onPick(slot, e.target.files?.[0] ?? null)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `photo-${slot}-error` : undefined}
        />
        {picked ? (
          // A local preview of the person's own file. It never leaves this browser.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={picked.url} alt={`Chosen: ${label}`} />
        ) : (
          <Camera size={28} strokeWidth={1.75} aria-hidden="true" />
        )}
        <span className="photo__label">{picked ? `Change: ${label}` : label}</span>
        <span className="small">{note}</span>
      </label>
      {error && <small className="field__error" id={`photo-${slot}-error`} role="alert">{error}</small>}
    </div>
  );
}

/**
 * The identity check, on preview rules. Every rule runs here, but nothing is uploaded: photos stay
 * in this browser and vanish on leaving. The server route for real checks is /api/identity.
 */
export function VerifyForm() {
  const session = usePreviewSession();
  const [stage, setStage] = useState<Stage>("details");
  const [legalName, setLegalName] = useState("");
  const [docType, setDocType] = useState<DocType>("nic");
  const [idNumber, setIdNumber] = useState("");
  const [errors, setErrors] = useState<IdentityErrors>({});
  const [photos, setPhotos] = useState<Partial<Record<Slot, Picked>>>({});
  const [photoErrors, setPhotoErrors] = useState<Partial<Record<Slot, string>>>({});
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState(false);

  // Local preview links are released when replaced and on leaving, never while a preview may still show.
  const links = useRef(new Set<string>());
  useEffect(() => {
    const open = links.current;
    return () => {
      open.forEach((url) => URL.revokeObjectURL(url));
      open.clear();
    };
  }, []);

  if (!session) {
    return (
      <div className="verify__alone">
        <h1 className="display auth__title">Create your account first</h1>
        <p>You confirm who you are straight after signing up.</p>
        <Link href="/signup" className="btn">Sign up</Link>
      </div>
    );
  }

  const needsBack = DOC_TYPES[docType].back;
  const next = homeFor(session.side ?? "household");

  const pick = async (slot: Slot, file: File | null) => {
    if (!file) return;
    const problem = await checkImage(file);
    setPhotoErrors((all) => ({ ...all, [slot]: problem ?? undefined }));
    if (problem) return;
    const url = URL.createObjectURL(file);
    links.current.add(url);
    const old = photos[slot]?.url;
    if (old) {
      URL.revokeObjectURL(old);
      links.current.delete(old);
    }
    setPhotos((all) => ({ ...all, [slot]: { file, url } }));
  };

  const submitDetails = (event: React.FormEvent) => {
    event.preventDefault();
    const result = validateIdentity({ legalName, docType, idNumber }, session.firstName);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setStage("documents");
  };

  const submitDocuments = (event: React.FormEvent) => {
    event.preventDefault();
    const missing: Partial<Record<Slot, string>> = {};
    if (!photos.front) missing.front = IMAGE_MESSAGES.missing;
    if (needsBack && !photos.back) missing.back = IMAGE_MESSAGES.missing;
    setPhotoErrors(missing);
    if (Object.keys(missing).length === 0) setStage("photo");
  };

  const finish = (event: React.FormEvent) => {
    event.preventDefault();
    const missing = !photos.selfie;
    if (missing) setPhotoErrors({ selfie: IMAGE_MESSAGES.missing });
    setConsentError(!consent);
    if (missing || !consent) return;
    // Nothing else is kept: the number, name and photos are dropped here.
    startPreviewSession({ ...session, idCheck: "preview-submitted" });
    links.current.forEach((url) => URL.revokeObjectURL(url));
    links.current.clear();
    setPhotos({});
    setIdNumber("");
    setLegalName("");
    setStage("done");
  };

  if (stage === "done") {
    return (
      <div className="verify__done" role="status">
        <ShieldCheck size={40} strokeWidth={1.75} aria-hidden="true" />
        <h1 className="display auth__title">Checks passed in preview</h1>
        <p className="lead">Your details were the right shape. Nothing was sent or kept, and no person has checked them.</p>
        <p>When accounts open, a reviewer compares your photo with your ID before you can post or answer a job.</p>
        <Link href={next} className="btn">Continue</Link>
      </div>
    );
  }

  const here = STAGES.findIndex((s) => s.id === stage);

  return (
    <div className="verify">
      <ol className="verify__track" aria-label="Progress">
        {STAGES.map((s, i) => (
          <li key={s.id} className={i === here ? "is-now" : i < here ? "is-past" : ""} aria-current={i === here ? "step" : undefined}>
            {i < here && <Check size={16} aria-hidden="true" />}{s.label}
          </li>
        ))}
      </ol>

      <p className="sample-note auth__preview">
        Preview: nothing here is uploaded. Please use sample pictures, not a real ID.
      </p>

      {stage === "details" && (
        <form onSubmit={submitDetails} method="post" noValidate>
          <h1 className="display verify__title">Confirm who you are</h1>
          <p className="verify__why">So nobody can pose as someone else on Oddjob. It’s needed before you post or answer a job.</p>
          <fieldset className="field">
            <legend>Which ID will you use?</legend>
            <div className="choice" style={{ marginTop: 6 }}>
              {(Object.keys(DOC_TYPES) as DocType[]).map((type) => (
                <label key={type}>
                  <input type="radio" checked={docType === type} onChange={() => { setDocType(type); setErrors({}); }} />
                  <span>{DOC_TYPES[type].label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <label className="field">
            <span>Full name, as printed on your ID</span>
            <input className="input" value={legalName} maxLength={100} autoComplete="name" onChange={(e) => setLegalName(e.target.value)} aria-invalid={Boolean(errors.legalName)} aria-describedby={errors.legalName ? "legal-error" : undefined} />
            {errors.legalName && <small className="field__error" id="legal-error" role="alert">{errors.legalName}</small>}
          </label>
          <label className="field">
            <span>{DOC_TYPES[docType].label} number</span>
            <input className="input num" value={idNumber} maxLength={24} autoComplete="off" spellCheck={false} placeholder={DOC_TYPES[docType].hint} onChange={(e) => setIdNumber(e.target.value)} aria-invalid={Boolean(errors.idNumber)} aria-describedby={errors.idNumber ? "number-error" : undefined} />
            {errors.idNumber && <small className="field__error" id="number-error" role="alert">{errors.idNumber}</small>}
          </label>
          <button type="submit" className="btn auth__go">Continue</button>
          <Link href={next} className="link auth__back">Do this later</Link>
        </form>
      )}

      {stage === "documents" && (
        <form onSubmit={submitDocuments} method="post" noValidate>
          <h1 className="display verify__title">Photograph your ID</h1>
          <p className="verify__why">Lay it flat in good light, with all four corners showing and every word sharp.</p>
          <div className="photo__row">
            <PhotoField slot="front" label={needsBack ? "Front of ID" : "Photo page"} note="JPG, PNG or WebP, up to 8 MB" picked={photos.front} error={photoErrors.front} onPick={pick} />
            {needsBack && <PhotoField slot="back" label="Back of ID" note="JPG, PNG or WebP, up to 8 MB" picked={photos.back} error={photoErrors.back} onPick={pick} />}
          </div>
          <button type="submit" className="btn auth__go">Continue</button>
          <button type="button" className="link auth__back" onClick={() => setStage("details")}>Back</button>
        </form>
      )}

      {stage === "photo" && (
        <form onSubmit={finish} method="post" noValidate>
          <h1 className="display verify__title">Take a photo of yourself</h1>
          <p className="verify__why">Face the camera with no hat or sunglasses. A reviewer compares it with your ID.</p>
          <PhotoField slot="selfie" label="Your photo" note="Your face only, in good light" picked={photos.selfie} error={photoErrors.selfie} selfie onPick={pick} />
          <label className="toggle verify__consent">
            <input type="checkbox" checked={consent} onChange={(e) => { setConsent(e.target.checked); if (e.target.checked) setConsentError(false); }} aria-invalid={consentError} />
            <span>I agree to Oddjob checking this ID to confirm who I am. It’s mine, and I understand it isn’t shown to other users.</span>
          </label>
          {consentError && <small className="field__error" role="alert">Please agree to continue.</small>}
          <button type="submit" className="btn auth__go verify__send">Finish</button>
          <button type="button" className="link auth__back" onClick={() => setStage("documents")}>Back</button>
        </form>
      )}
    </div>
  );
}
