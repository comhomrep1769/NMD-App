import React from "react";
import { apiFetch } from "../api";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not read image."));
    };

    reader.onerror = () => reject(new Error("Could not read image."));
    reader.readAsDataURL(file);
  });
}

export default function ServiceRequestPage() {
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [serviceType, setServiceType] = React.useState("Driveway Cleaning");
  const [preferredDate, setPreferredDate] = React.useState("");
  const [preferredTime, setPreferredTime] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [photoDataUrl, setPhotoDataUrl] = React.useState<string | null>(null);
  const [photoNote, setPhotoNote] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const [error, setError] = React.useState("");
  const [photoLoading, setPhotoLoading] = React.useState(false);

  const handlePhoto = async (file?: File) => {
    setError("");

    if (!file) {
      setPhotoDataUrl(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }

    if (file.size > 1_800_000) {
      setError("Image is too large. Please upload a smaller image under about 1.8MB.");
      return;
    }

    try {
      setPhotoLoading(true);
      const dataUrl = await fileToDataUrl(file);
      setPhotoDataUrl(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load image.");
    } finally {
      setPhotoLoading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await apiFetch("/api/requests/public", {
        method: "POST",
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          email,
          address,
          serviceType,
          preferredDate: preferredDate || null,
          preferredTime,
          notes,
          photoDataUrl,
          photoNote
        })
      });

      setSubmitted(true);
      setFirstName("");
      setLastName("");
      setPhone("");
      setEmail("");
      setAddress("");
      setServiceType("Driveway Cleaning");
      setPreferredDate("");
      setPreferredTime("");
      setNotes("");
      setPhotoDataUrl(null);
      setPhotoNote("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit request");
    }
  };

  if (submitted) {
    return (
      <div className="loginShell">
        <section className="loginCard">
          <h1 className="panelTitle">Request Sent</h1>
          <p className="brandSubtitle">
            Thank you. NMD Pressure Washing Services LLC received your request.
          </p>
          <button className="primaryButton" onClick={() => setSubmitted(false)}>
            Submit Another Request
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="loginShell">
      <section className="loginCard">
        <h1 className="panelTitle">Request Service</h1>
        <p className="brandSubtitle">
          NMD Pressure Washing Services LLC • No More Dirt
        </p>

        {error && <div className="errorBox">{error}</div>}

        <form className="formGrid" onSubmit={submit}>
          <input
            className="textInput"
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />

          <input
            className="textInput"
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />

          <input
            className="textInput"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <input
            className="textInput"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="textInput"
            placeholder="Service address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <select
            className="textInput"
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
          >
            <option value="Driveway Cleaning">Driveway Cleaning</option>
            <option value="Sidewalk Cleaning">Sidewalk Cleaning</option>
            <option value="House Siding">House Siding</option>
            <option value="Roof Cleaning">Roof Cleaning</option>
            <option value="Fence Cleaning">Fence Cleaning</option>
            <option value="Trash Can Cleaning">Trash Can Cleaning</option>
            <option value="Commercial Cleaning">Commercial Cleaning</option>
            <option value="Other">Other</option>
          </select>

          <input
            className="textInput"
            type="date"
            value={preferredDate}
            onChange={(e) => setPreferredDate(e.target.value)}
          />

          <input
            className="textInput"
            placeholder="Preferred time window"
            value={preferredTime}
            onChange={(e) => setPreferredTime(e.target.value)}
          />

          <textarea
            className="textInput"
            placeholder="Notes / details about the surface, stains, access, etc."
            rows={5}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="assignBox">
            <div className="assignTitle">Upload Photo Optional</div>

            <input
              className="textInput"
              type="file"
              accept="image/*"
              onChange={(e) => handlePhoto(e.target.files?.[0])}
            />

            {photoLoading && <div className="chatMeta">Loading photo...</div>}

            {photoDataUrl && (
              <div style={{ marginTop: 12 }}>
                <img
                  src={photoDataUrl}
                  alt="Request upload preview"
                  style={{
                    width: "100%",
                    maxHeight: 260,
                    objectFit: "cover",
                    borderRadius: 14,
                    border: "1px solid var(--border)"
                  }}
                />

                <button
                  className="secondaryButton"
                  type="button"
                  style={{ marginTop: 10 }}
                  onClick={() => setPhotoDataUrl(null)}
                >
                  Remove Photo
                </button>
              </div>
            )}
          </div>

          <textarea
            className="textInput"
            placeholder="Photo note optional — describe what the image shows"
            rows={3}
            value={photoNote}
            onChange={(e) => setPhotoNote(e.target.value)}
          />

          <button className="primaryButton" type="submit">
            Submit Request
          </button>
        </form>
      </section>
    </div>
  );
}
