import React from "react";
import { apiFetch } from "../api";

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
  const [submitted, setSubmitted] = React.useState(false);
  const [error, setError] = React.useState("");

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
          notes
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

          <button className="primaryButton" type="submit">
            Submit Request
          </button>
        </form>
      </section>
    </div>
  );
}
