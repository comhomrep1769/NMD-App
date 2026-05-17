import React from "react";
import ServicesCatalog from "../components/ServicesCatalog";
import type { NmdServiceItem } from "../utils/nmdServicesCatalog";

type ServiceRequestForm = {
  selectedService: string;
  customerName: string;
  email: string;
  phone: string;
  serviceAddress: string;
  preferredDate: string;
  preferredTime: string;
  propertyType: string;
  surfaceDetails: string;
  problemDescription: string;
  estimatedSize: string;
  photoNotes: string;
  specialConcerns: string;
};

const emptyForm: ServiceRequestForm = {
  selectedService: "",
  customerName: "",
  email: "",
  phone: "",
  serviceAddress: "",
  preferredDate: "",
  preferredTime: "",
  propertyType: "",
  surfaceDetails: "",
  problemDescription: "",
  estimatedSize: "",
  photoNotes: "",
  specialConcerns: ""
};

export default function ServiceRequestPage() {
  const [form, setForm] = React.useState<ServiceRequestForm>(emptyForm);
  const [selectedServiceDetails, setSelectedServiceDetails] = React.useState<NmdServiceItem | null>(null);
  const [success, setSuccess] = React.useState("");
  const [uploadedPhotos, setUploadedPhotos] = React.useState<Array<{ id: string; name: string; note: string }>>([]);

  const updateForm = (field: keyof ServiceRequestForm, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const chooseService = (service: NmdServiceItem) => {
    setSelectedServiceDetails(service);
    updateForm("selectedService", service.title);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const addPhotos = (files: FileList | null) => {
    if (!files) return;

    const next = Array.from(files).map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: file.name,
      note: ""
    }));

    setUploadedPhotos((prev) => [...next, ...prev]);
  };

  const updatePhotoNote = (id: string, note: string) => {
    setUploadedPhotos((prev) =>
      prev.map((photo) => (photo.id === id ? { ...photo, note } : photo))
    );
  };

  const removePhoto = (id: string) => {
    setUploadedPhotos((prev) => prev.filter((photo) => photo.id !== id));
  };

  const submitRequest = (event: React.FormEvent) => {
    event.preventDefault();

    setSuccess(
      "Service request draft captured. Backend saving, image upload storage, and admin review workflow will connect in the photo/job phase."
    );
  };

  return (
    <div className="pageGrid">
      <section className="clientHeroPanel">
        <div className="clientHeroContent">
          <span className="clientEyebrow">Request Service</span>
          <h1>Tell NMD what needs cleaning.</h1>
          <p>
            Choose a service, add property details, upload helpful photos, and include
            notes about stains, surfaces, access, or pre-existing damage.
          </p>
        </div>

        <div className="clientStatusCard">
          <div className="statLabel">Photo Tip</div>
          <div className="clientStatusTitle">Better photos = better estimates</div>
          <p>
            Include wide shots, close-up stains, access areas, water source locations,
            and anything fragile or already damaged.
          </p>
        </div>
      </section>

      {success && (
        <div className="listCard" style={{ borderColor: "rgba(34, 197, 94, 0.65)" }}>
          {success}
        </div>
      )}

      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2 className="panelTitle">Service Request Details</h2>
            <p className="brandSubtitle">
              This form is client-facing and prepares the request for admin review,
              quote creation, photo records, and future Guru estimate intake.
            </p>
          </div>
        </div>

        {selectedServiceDetails && (
          <div className="listCard">
            <strong>Selected service:</strong> {selectedServiceDetails.title}
            <div className="cardLine">{selectedServiceDetails.estimateNotes}</div>
          </div>
        )}

        <form className="formGrid" onSubmit={submitRequest} style={{ marginTop: 16 }}>
          <label className="fieldLabel">
            Selected Service
            <input
              className="textInput"
              value={form.selectedService}
              onChange={(event) => updateForm("selectedService", event.target.value)}
              placeholder="Example: Roof Cleaning"
            />
          </label>

          <label className="fieldLabel">
            Name
            <input
              className="textInput"
              value={form.customerName}
              onChange={(event) => updateForm("customerName", event.target.value)}
              placeholder="Your name"
            />
          </label>

          <label className="fieldLabel">
            Email
            <input
              className="textInput"
              value={form.email}
              onChange={(event) => updateForm("email", event.target.value)}
              placeholder="you@example.com"
            />
          </label>

          <label className="fieldLabel">
            Phone
            <input
              className="textInput"
              value={form.phone}
              onChange={(event) => updateForm("phone", event.target.value)}
              placeholder="Phone number"
            />
          </label>

          <label className="fieldLabel">
            Service Address
            <input
              className="textInput"
              value={form.serviceAddress}
              onChange={(event) => updateForm("serviceAddress", event.target.value)}
              placeholder="Where service is needed"
            />
          </label>

          <label className="fieldLabel">
            Preferred Date
            <input
              className="textInput"
              type="date"
              value={form.preferredDate}
              onChange={(event) => updateForm("preferredDate", event.target.value)}
            />
          </label>

          <label className="fieldLabel">
            Preferred Time Slot
            <select
              className="textInput"
              value={form.preferredTime}
              onChange={(event) => updateForm("preferredTime", event.target.value)}
            >
              <option value="">Choose a preferred time</option>
              <option value="morning">Morning</option>
              <option value="midday">Midday</option>
              <option value="afternoon">Afternoon</option>
              <option value="flexible">Flexible</option>
            </select>
          </label>

          <label className="fieldLabel">
            Property Type
            <input
              className="textInput"
              value={form.propertyType}
              onChange={(event) => updateForm("propertyType", event.target.value)}
              placeholder="Residential, commercial, HOA, restaurant, industrial..."
            />
          </label>

          <label className="fieldLabel">
            Surface Details
            <textarea
              className="textInput"
              rows={3}
              value={form.surfaceDetails}
              onChange={(event) => updateForm("surfaceDetails", event.target.value)}
              placeholder="Concrete, vinyl siding, roof shingles, tile roof, pavers, wood deck..."
            />
          </label>

          <label className="fieldLabel">
            Problem / Stain Description
            <textarea
              className="textInput"
              rows={3}
              value={form.problemDescription}
              onChange={(event) => updateForm("problemDescription", event.target.value)}
              placeholder="Algae, black streaks, rust, oil, gum, oxidation, grease, mildew..."
            />
          </label>

          <label className="fieldLabel">
            Estimated Size / Dimensions
            <input
              className="textInput"
              value={form.estimatedSize}
              onChange={(event) => updateForm("estimatedSize", event.target.value)}
              placeholder="Example: 2-car driveway, 2,000 sq ft roof, 120 ft sidewalk..."
            />
          </label>

          <label className="fieldLabel">
            Photo Notes
            <textarea
              className="textInput"
              rows={3}
              value={form.photoNotes}
              onChange={(event) => updateForm("photoNotes", event.target.value)}
              placeholder="Explain what the uploaded photos show."
            />
          </label>

          <label className="fieldLabel">
            Special Concerns / Pre-existing Damage
            <textarea
              className="textInput"
              rows={3}
              value={form.specialConcerns}
              onChange={(event) => updateForm("specialConcerns", event.target.value)}
              placeholder="Loose paint, cracked concrete, damaged screens, dead plants, oxidation, leaks..."
            />
          </label>

          <label className="fieldLabel">
            Upload Property Photos
            <input
              className="textInput"
              type="file"
              multiple
              accept="image/*"
              onChange={(event) => addPhotos(event.target.files)}
            />
          </label>

          {uploadedPhotos.length > 0 && (
            <div className="cardsGrid">
              {uploadedPhotos.map((photo) => (
                <div key={photo.id} className="quoteCard">
                  <div className="quoteTopRow">
                    <div className="quoteNumber">{photo.name}</div>
                    <span className="statusBadge status-approved">Photo</span>
                  </div>

                  <label className="fieldLabel">
                    Photo Note
                    <textarea
                      className="textInput"
                      rows={3}
                      value={photo.note}
                      onChange={(event) => updatePhotoNote(photo.id, event.target.value)}
                      placeholder="Example: pre-existing crack near garage, rust stain by sprinkler..."
                    />
                  </label>

                  <div className="buttonRow" style={{ marginTop: 12 }}>
                    <button
                      className="dangerButton"
                      type="button"
                      onClick={() => removePhoto(photo.id)}
                    >
                      Delete / Retake
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="buttonRow">
            <button className="primaryButton" type="submit">
              Submit Service Request
            </button>

            <a className="secondaryButton" href="/client">
              Back to Client Portal
            </a>
          </div>
        </form>
      </section>

      <ServicesCatalog onRequestService={chooseService} />
    </div>
  );
}
