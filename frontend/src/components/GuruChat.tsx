import React from "react";
import { apiFetch } from "../api";
import type { AuthUser, PageKey } from "../types";

type GuruMessage = {
  id: string;
  sender: "guru" | "user";
  body: string;
  createdAt: string;
};

type BackendGuruMessage = {
  id: string;
  userId: string;
  roleContext: "admin" | "employee" | "client";
  sender: "guru" | "user";
  body: string;
  createdAt: string;
};

type GuruEstimateSummary = {
  id: string;
  status: string;
};

type EstimateForm = {
  clientName: string;
  phone: string;
  email: string;
  address: string;
  serviceType: string;
  propertyArea: string;
  surfaceType: string;
  conditionLevel: string;
  squareFootage: string;
  preferredSchedule: string;
  specialConcerns: string;
  photoDataUrl: string | null;
  photoNote: string;
};

const GURU_ICON_SRC = "/icons/NMD-Guru-Icon.png?v=2026051419";

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

function getRoleLabel(user: AuthUser | null) {
  if (!user) return "Client";
  if (user.role === "admin") return "Admin";
  if (user.role === "employee") return "Employee";
  return "Client";
}

function getGreeting(user: AuthUser | null) {
  if (!user || user.role === "client") {
    return "Hi, I’m Guru. What services are you looking to utilize to revive your home?";
  }

  if (user.role === "employee") {
    return "Hi, I’m Guru. I can help with job notes, treatment guidance, safety reminders, surface questions, and field workflow.";
  }

  return "Hi, I’m Guru. I can help with quotes, invoices, scheduling, payments, treatments, pricing, job planning, and business operations.";
}

function getQuickPrompts(user: AuthUser | null) {
  if (!user || user.role === "client") {
    return [
      "Start estimate",
      "My estimates",
      "My quotes",
      "What services do you offer?"
    ];
  }

  if (user.role === "employee") {
    return [
      "Help with a treatment",
      "What should I check on this job?",
      "Open field tips",
      "Help collect payment"
    ];
  }

  return [
    "Review Guru estimates",
    "Create quote draft",
    "Check payments",
    "Help price a job"
  ];
}

function mapBackendMessage(message: BackendGuruMessage): GuruMessage {
  return {
    id: message.id,
    sender: message.sender,
    body: message.body,
    createdAt: message.createdAt
  };
}

function localStorageKey(user: AuthUser | null) {
  return user ? `nmd-guru-open-${user.id}` : "nmd-guru-open-public";
}

const emptyEstimateForm: EstimateForm = {
  clientName: "",
  phone: "",
  email: "",
  address: "",
  serviceType: "",
  propertyArea: "",
  surfaceType: "",
  conditionLevel: "",
  squareFootage: "",
  preferredSchedule: "",
  specialConcerns: "",
  photoDataUrl: null,
  photoNote: ""
};

export default function GuruChat({
  user,
  onNavigate
}: {
  user: AuthUser | null;
  onNavigate?: (page: PageKey) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [hasUnread, setHasUnread] = React.useState(true);
  const [adminReviewCount, setAdminReviewCount] = React.useState(0);
  const [clientEstimateSubmitted, setClientEstimateSubmitted] = React.useState(false);
  const [typing, setTyping] = React.useState(false);
  const [input, setInput] = React.useState("");
  const [loadingHistory, setLoadingHistory] = React.useState(false);
  const [error, setError] = React.useState("");
  const [estimateMode, setEstimateMode] = React.useState(false);
  const [savingEstimate, setSavingEstimate] = React.useState(false);
  const [iconLoaded, setIconLoaded] = React.useState(true);
  const [isDesktop, setIsDesktop] = React.useState(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(min-width: 821px)").matches;
  });

  const floatingIconSize = isDesktop ? 104 : 82;
  const floatingImageSize = isDesktop ? "108%" : "100%";
  const notificationDotOffset = isDesktop ? 8 : 4;
  const chatPanelBottom = isDesktop ? 128 : 106;

  const [estimateForm, setEstimateForm] = React.useState<EstimateForm>(() => ({
    ...emptyEstimateForm,
    clientName: user?.displayName || "",
    email: user?.email || ""
  }));

  const [messages, setMessages] = React.useState<GuruMessage[]>([
    {
      id: "welcome",
      sender: "guru",
      body: getGreeting(user),
      createdAt: new Date().toISOString()
    }
  ]);

  React.useEffect(() => {
    const query = window.matchMedia("(min-width: 821px)");

    const updateDesktopState = () => {
      setIsDesktop(query.matches);
    };

    updateDesktopState();
    query.addEventListener("change", updateDesktopState);

    return () => {
      query.removeEventListener("change", updateDesktopState);
    };
  }, []);

  React.useEffect(() => {
    const savedOpen = localStorage.getItem(localStorageKey(user));
    setOpen(savedOpen === "true");

    setEstimateForm((prev) => ({
      ...prev,
      clientName: user?.displayName || prev.clientName,
      email: user?.email || prev.email
    }));
  }, [user?.id]);

  React.useEffect(() => {
    localStorage.setItem(localStorageKey(user), String(open));
  }, [open, user?.id]);

  React.useEffect(() => {
    let cancelled = false;

    const loadAdminReviewCount = async () => {
      if (!user || user.role !== "admin") {
        setAdminReviewCount(0);
        return;
      }

      try {
        const data = await apiFetch<{ estimates: GuruEstimateSummary[] }>("/api/guru/estimates");
        if (cancelled) return;

        const needsReview = data.estimates.filter(
          (estimate) => estimate.status === "needs_review"
        ).length;

        setAdminReviewCount(needsReview);

        if (needsReview > 0 && !open) {
          setHasUnread(true);
        }
      } catch {
        if (!cancelled) {
          setAdminReviewCount(0);
        }
      }
    };

    loadAdminReviewCount();

    const interval = window.setInterval(loadAdminReviewCount, 60000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [user?.id, user?.role, open]);

  React.useEffect(() => {
    setError("");
    setClientEstimateSubmitted(false);

    if (!user) {
      setMessages([
        {
          id: "welcome-public",
          sender: "guru",
          body: getGreeting(null),
          createdAt: new Date().toISOString()
        }
      ]);
      return;
    }

    setLoadingHistory(true);

    apiFetch<{ messages: BackendGuruMessage[] }>("/api/guru/messages")
      .then((data) => {
        if (data.messages.length === 0) {
          setMessages([
            {
              id: "welcome",
              sender: "guru",
              body: getGreeting(user),
              createdAt: new Date().toISOString()
            }
          ]);
        } else {
          setMessages(data.messages.map(mapBackendMessage));
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Could not load Guru history");
        setMessages([
          {
            id: "welcome-error",
            sender: "guru",
            body: getGreeting(user),
            createdAt: new Date().toISOString()
          }
        ]);
      })
      .finally(() => {
        setLoadingHistory(false);
      });
  }, [user?.id, user?.role]);

  const openGuru = () => {
    setOpen(true);
    setHasUnread(false);
    setTyping(true);

    window.setTimeout(() => {
      setTyping(false);
    }, 650);
  };

  const closeGuru = () => {
    setOpen(false);
  };

  const openGuruEstimatesReview = () => {
    if (onNavigate) {
      onNavigate("guru-estimates");
      setOpen(false);
      setHasUnread(false);
    } else {
      submitMessage("Review Guru estimates");
    }
  };

  const openClientEstimates = () => {
    if (onNavigate) {
      onNavigate("client-estimates");
      setOpen(false);
      setHasUnread(false);
      setClientEstimateSubmitted(false);
    } else {
      submitMessage("My estimates");
    }
  };

  const openClientQuotes = () => {
    if (onNavigate) {
      onNavigate("client-quotes");
      setOpen(false);
      setHasUnread(false);
    } else {
      submitMessage("My quotes");
    }
  };

  const getLocalGuruReply = (messageBody: string) => {
    const lower = messageBody.toLowerCase();

    if (lower.includes("quote") || lower.includes("estimate") || lower.includes("start estimate")) {
      return "I can help start your estimate. Please create or log into a client account so I can save your estimate request for NMD admin review.";
    }

    if (lower.includes("recurring")) {
      return "Recurring service is a great option. NMD can help with routine exterior cleaning, trash can cleaning, and maintenance schedules.";
    }

    return "I have this noted. Once you create or log into a client account, Guru will save your chat history and help continue your request.";
  };

  const startEstimate = () => {
    if (!user) {
      submitMessage("Start estimate");
      return;
    }

    if (user.role !== "client") {
      if (user.role === "admin") {
        openGuruEstimatesReview();
        return;
      }

      submitMessage("Review Guru estimates");
      return;
    }

    setEstimateMode(true);
    setOpen(true);
    setHasUnread(false);
  };

  const submitMessage = async (body?: string) => {
    const messageBody = (body || input).trim();
    if (!messageBody) return;

    const lowerMessage = messageBody.toLowerCase();

    if (lowerMessage.includes("start estimate") && user?.role === "client") {
      startEstimate();
      setInput("");
      return;
    }

    if (messageBody === "Review Guru estimates" && user?.role === "admin" && onNavigate) {
      openGuruEstimatesReview();
      setInput("");
      return;
    }

    if (messageBody === "My estimates" && user?.role === "client" && onNavigate) {
      openClientEstimates();
      setInput("");
      return;
    }

    if (messageBody === "My quotes" && user?.role === "client" && onNavigate) {
      openClientQuotes();
      setInput("");
      return;
    }

    setError("");
    setInput("");

    if (!user) {
      const userMessage: GuruMessage = {
        id: `local-user-${Date.now()}`,
        sender: "user",
        body: messageBody,
        createdAt: new Date().toISOString()
      };

      setMessages((prev) => [...prev, userMessage]);
      setTyping(true);

      window.setTimeout(() => {
        const guruMessage: GuruMessage = {
          id: `local-guru-${Date.now()}`,
          sender: "guru",
          body: getLocalGuruReply(messageBody),
          createdAt: new Date().toISOString()
        };

        setMessages((prev) => [...prev, guruMessage]);
        setTyping(false);
      }, 700);

      return;
    }

    const optimisticUserMessage: GuruMessage = {
      id: `optimistic-user-${Date.now()}`,
      sender: "user",
      body: messageBody,
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => [...prev, optimisticUserMessage]);
    setTyping(true);

    try {
      const data = await apiFetch<{
        userMessage: BackendGuruMessage;
        guruMessage: BackendGuruMessage;
      }>("/api/guru/messages", {
        method: "POST",
        body: JSON.stringify({
          body: messageBody
        })
      });

      setMessages((prev) => {
        const withoutOptimistic = prev.filter(
          (message) => message.id !== optimisticUserMessage.id
        );

        return [
          ...withoutOptimistic,
          mapBackendMessage(data.userMessage),
          mapBackendMessage(data.guruMessage)
        ];
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Guru message failed");

      setMessages((prev) => [
        ...prev,
        {
          id: `guru-error-${Date.now()}`,
          sender: "guru",
          body: "I could not save that message right now. Please try again.",
          createdAt: new Date().toISOString()
        }
      ]);
    } finally {
      setTyping(false);
    }
  };

  const handleEstimatePhoto = async (file?: File) => {
    setError("");

    if (!file) {
      updateEstimateField("photoDataUrl", null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }

    if (file.size > 1_800_000) {
      setError("Estimate photo is too large. Please upload an image under about 1.8MB.");
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      updateEstimateField("photoDataUrl", dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load estimate photo.");
    }
  };

  const submitEstimate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!user || user.role !== "client") {
      setError("Please log into a client account to submit a Guru estimate.");
      return;
    }

    try {
      setSavingEstimate(true);

      const data = await apiFetch<{
        estimate: {
          id: string;
          preliminaryEstimateLow: number;
          preliminaryEstimateHigh: number;
        };
      }>("/api/guru/estimate-intake", {
        method: "POST",
        body: JSON.stringify(estimateForm)
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `estimate-user-${Date.now()}`,
          sender: "user",
          body: `Submitted estimate details for ${estimateForm.serviceType} at ${estimateForm.address}.`,
          createdAt: new Date().toISOString()
        },
        {
          id: `estimate-guru-${Date.now()}`,
          sender: "guru",
          body: `Thanks. Your preliminary estimate request was submitted for admin review. Early range: $${data.estimate.preliminaryEstimateLow.toFixed(
            2
          )} - $${data.estimate.preliminaryEstimateHigh.toFixed(
            2
          )}. This is not a final quote. NMD will review and confirm official pricing.`,
          createdAt: new Date().toISOString()
        }
      ]);

      setEstimateMode(false);
      setClientEstimateSubmitted(true);
      setEstimateForm({
        ...emptyEstimateForm,
        clientName: user.displayName,
        email: user.email
      });

      setHasUnread(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit estimate");
    } finally {
      setSavingEstimate(false);
    }
  };

  const clearHistory = async () => {
    if (!user) {
      setMessages([
        {
          id: "welcome-public-reset",
          sender: "guru",
          body: getGreeting(null),
          createdAt: new Date().toISOString()
        }
      ]);
      return;
    }

    const ok = window.confirm("Clear your Guru chat history?");
    if (!ok) return;

    setError("");

    try {
      await apiFetch("/api/guru/messages", {
        method: "DELETE"
      });

      setMessages([
        {
          id: "welcome-reset",
          sender: "guru",
          body: getGreeting(user),
          createdAt: new Date().toISOString()
        }
      ]);

      setClientEstimateSubmitted(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not clear Guru history");
    }
  };

  const updateEstimateField = (field: keyof EstimateForm, value: string | null) => {
    setEstimateForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const roleLabel = getRoleLabel(user);
  const quickPrompts = getQuickPrompts(user);
  const shouldShowNotification = user?.role === "admin" ? adminReviewCount > 0 : hasUnread;

  return (
    <>
      <button
        type="button"
        onClick={openGuru}
        aria-label="Open Guru chat"
        title="Open Guru"
        style={{
          position: "fixed",
          right: 18,
          bottom: open ? 18 : 86,
          zIndex: 120,
          width: floatingIconSize,
          height: floatingIconSize,
          border: "none",
          background: "transparent",
          color: "#ffffff",
          cursor: "pointer",
          display: "grid",
          placeItems: "center",
          padding: 0,
          overflow: "visible"
        }}
      >
        {iconLoaded ? (
          <img
            src={GURU_ICON_SRC}
            alt="Guru"
            onError={() => setIconLoaded(false)}
            style={{
              width: floatingImageSize,
              height: floatingImageSize,
              objectFit: "contain",
              borderRadius: 0,
              filter: "drop-shadow(0 18px 28px rgba(0,0,0,0.45))"
            }}
          />
        ) : (
          <span
            style={{
              width: floatingIconSize,
              height: floatingIconSize,
              borderRadius: "999px",
              display: "grid",
              placeItems: "center",
              background:
                "radial-gradient(circle at 30% 25%, rgba(59,130,246,0.96), rgba(16,185,129,0.92) 45%, rgba(2,6,23,0.98) 100%)",
              border: "2px solid rgba(52, 211, 153, 0.75)",
              fontWeight: 900
            }}
          >
            Guru
          </span>
        )}

        {shouldShowNotification && (
          <span
            style={{
              position: "absolute",
              top: notificationDotOffset,
              right: notificationDotOffset,
              minWidth: adminReviewCount > 0 ? 24 : 16,
              height: adminReviewCount > 0 ? 24 : 16,
              padding: adminReviewCount > 0 ? "0 6px" : 0,
              borderRadius: "999px",
              background: "#ef4444",
              border: "2px solid #ffffff",
              boxShadow: "0 0 0 3px rgba(239,68,68,0.25)",
              zIndex: 2,
              display: "grid",
              placeItems: "center",
              color: "#ffffff",
              fontSize: 12,
              fontWeight: 900,
              lineHeight: 1
            }}
          >
            {adminReviewCount > 0 ? adminReviewCount : ""}
          </span>
        )}
      </button>

      {open && (
        <section
          style={{
            position: "fixed",
            right: 18,
            bottom: chatPanelBottom,
            zIndex: 130,
            width: "min(92vw, 440px)",
            height: "min(82vh, 720px)",
            background: "var(--panel)",
            border: "1px solid var(--border)",
            borderRadius: 24,
            overflow: "hidden",
            boxShadow: "0 26px 80px rgba(0,0,0,0.55)",
            display: "flex",
            flexDirection: "column"
          }}
        >
          <div
            style={{
              padding: 16,
              borderBottom: "1px solid var(--border)",
              background:
                "linear-gradient(135deg, rgba(16,185,129,0.18), rgba(37,99,235,0.16))"
            }}
          >
            <div className="panelHeader">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {iconLoaded && (
                  <img
                    src={GURU_ICON_SRC}
                    alt="Guru"
                    onError={() => setIconLoaded(false)}
                    style={{
                      width: 54,
                      height: 54,
                      objectFit: "contain",
                      borderRadius: 0,
                      filter: "drop-shadow(0 8px 14px rgba(0,0,0,0.35))"
                    }}
                  />
                )}

                <div>
                  <h2 className="panelTitle" style={{ margin: 0 }}>
                    Guru
                  </h2>
                  <p className="brandSubtitle">
                    {roleLabel} assistant • NMD Pressure Washing
                  </p>
                </div>
              </div>

              <button className="secondaryButton" type="button" onClick={closeGuru}>
                Close
              </button>
            </div>

            {user?.role === "admin" && adminReviewCount > 0 && (
              <div className="errorBox" style={{ marginTop: 10 }}>
                {adminReviewCount} Guru estimate{adminReviewCount === 1 ? "" : "s"} need admin review.

                <div className="buttonRow" style={{ marginTop: 10 }}>
                  <button
                    className="primaryButton"
                    type="button"
                    onClick={openGuruEstimatesReview}
                  >
                    Review Estimates
                  </button>
                </div>
              </div>
            )}

            {user?.role === "client" && clientEstimateSubmitted && (
              <div className="listCard" style={{ marginTop: 10 }}>
                Your Guru estimate was submitted for NMD review.

                <div className="buttonRow" style={{ marginTop: 10 }}>
                  <button className="primaryButton" type="button" onClick={openClientEstimates}>
                    View My Estimates
                  </button>

                  <button className="secondaryButton" type="button" onClick={openClientQuotes}>
                    View My Quotes
                  </button>
                </div>
              </div>
            )}

            <div className="buttonRow" style={{ marginTop: 10 }}>
              {user?.role === "client" && (
                <button className="primaryButton" type="button" onClick={startEstimate}>
                  Start Estimate
                </button>
              )}

              {user?.role === "admin" && (
                <button className="primaryButton" type="button" onClick={openGuruEstimatesReview}>
                  Estimate Review
                </button>
              )}

              <button className="secondaryButton" type="button" onClick={clearHistory}>
                Clear Chat
              </button>
            </div>
          </div>

          <div
            style={{
              padding: 14,
              overflowY: "auto",
              flex: 1,
              display: "grid",
              gap: 10,
              alignContent: "start"
            }}
          >
            {error && <div className="errorBox">{error}</div>}

            {estimateMode && user?.role === "client" && (
              <form className="formGrid" onSubmit={submitEstimate}>
                <div className="listCard">
                  Guru estimates are preliminary. Admin must review and approve final pricing.
                </div>

                <input
                  className="textInput"
                  placeholder="Full name"
                  value={estimateForm.clientName}
                  onChange={(e) => updateEstimateField("clientName", e.target.value)}
                />

                <input
                  className="textInput"
                  placeholder="Phone"
                  value={estimateForm.phone}
                  onChange={(e) => updateEstimateField("phone", e.target.value)}
                />

                <input
                  className="textInput"
                  placeholder="Email"
                  value={estimateForm.email}
                  onChange={(e) => updateEstimateField("email", e.target.value)}
                />

                <input
                  className="textInput"
                  placeholder="Service address"
                  value={estimateForm.address}
                  onChange={(e) => updateEstimateField("address", e.target.value)}
                />

                <select
                  className="textInput"
                  value={estimateForm.serviceType}
                  onChange={(e) => updateEstimateField("serviceType", e.target.value)}
                >
                  <option value="">Select service type</option>
                  <option value="House Washing">House Washing</option>
                  <option value="Driveway / Concrete Cleaning">Driveway / Concrete Cleaning</option>
                  <option value="Roof Cleaning">Roof Cleaning</option>
                  <option value="Fence Cleaning">Fence Cleaning</option>
                  <option value="Pool Deck Cleaning">Pool Deck Cleaning</option>
                  <option value="Trash Can Cleaning">Trash Can Cleaning</option>
                  <option value="Commercial Cleaning">Commercial Cleaning</option>
                  <option value="Rust Removal / Specialty Restoration">
                    Rust Removal / Specialty Restoration
                  </option>
                  <option value="Other">Other</option>
                </select>

                <input
                  className="textInput"
                  placeholder="Property area, example: driveway, roof, back patio"
                  value={estimateForm.propertyArea}
                  onChange={(e) => updateEstimateField("propertyArea", e.target.value)}
                />

                <input
                  className="textInput"
                  placeholder="Surface/material, example: vinyl, concrete, pavers, shingles"
                  value={estimateForm.surfaceType}
                  onChange={(e) => updateEstimateField("surfaceType", e.target.value)}
                />

                <select
                  className="textInput"
                  value={estimateForm.conditionLevel}
                  onChange={(e) => updateEstimateField("conditionLevel", e.target.value)}
                >
                  <option value="">Condition level</option>
                  <option value="Light">Light</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Heavy">Heavy</option>
                  <option value="Severe">Severe</option>
                  <option value="Unsure">Unsure</option>
                </select>

                <input
                  className="textInput"
                  placeholder="Square footage or dimensions if known"
                  value={estimateForm.squareFootage}
                  onChange={(e) => updateEstimateField("squareFootage", e.target.value)}
                />

                <input
                  className="textInput"
                  placeholder="Preferred schedule"
                  value={estimateForm.preferredSchedule}
                  onChange={(e) => updateEstimateField("preferredSchedule", e.target.value)}
                />

                <textarea
                  className="textInput"
                  placeholder="Special concerns, stains, access issues, oxidation, plants, pets, etc."
                  rows={4}
                  value={estimateForm.specialConcerns}
                  onChange={(e) => updateEstimateField("specialConcerns", e.target.value)}
                />

                <div className="assignBox">
                  <div className="assignTitle">Upload Photo Optional</div>
                  <div className="cardLine">
                    Add one clear photo of the surface, stains, access area, or problem spot.
                  </div>

                  <input
                    className="textInput"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleEstimatePhoto(e.target.files?.[0])}
                  />

                  {estimateForm.photoDataUrl && (
                    <div style={{ marginTop: 12 }}>
                      <img
                        src={estimateForm.photoDataUrl}
                        alt="Estimate preview"
                        style={{
                          width: "100%",
                          maxHeight: 240,
                          objectFit: "cover",
                          borderRadius: 14,
                          border: "1px solid var(--border)"
                        }}
                      />

                      <button
                        className="secondaryButton"
                        type="button"
                        style={{ marginTop: 10 }}
                        onClick={() => updateEstimateField("photoDataUrl", null)}
                      >
                        Remove Photo
                      </button>
                    </div>
                  )}
                </div>

                <input
                  className="textInput"
                  placeholder="Photo note optional"
                  value={estimateForm.photoNote}
                  onChange={(e) => updateEstimateField("photoNote", e.target.value)}
                />

                <div className="buttonRow">
                  <button className="primaryButton" type="submit" disabled={savingEstimate}>
                    {savingEstimate ? "Submitting..." : "Submit For Admin Review"}
                  </button>

                  <button
                    className="secondaryButton"
                    type="button"
                    onClick={() => setEstimateMode(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {!estimateMode && loadingHistory && (
              <div className="listCard">Loading Guru history...</div>
            )}

            {!estimateMode &&
              messages.map((message) => (
                <div
                  key={message.id}
                  style={{
                    justifySelf: message.sender === "user" ? "end" : "start",
                    maxWidth: "88%",
                    padding: "10px 12px",
                    borderRadius: 16,
                    border: "1px solid var(--border)",
                    background:
                      message.sender === "user"
                        ? "linear-gradient(135deg, rgba(16,185,129,0.22), rgba(37,99,235,0.18))"
                        : "rgba(255,255,255,0.04)"
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      opacity: 0.75,
                      marginBottom: 4,
                      fontWeight: 800
                    }}
                  >
                    {message.sender === "user" ? "You" : "Guru"}
                  </div>

                  <div className="cardLine" style={{ margin: 0 }}>
                    {message.body}
                  </div>
                </div>
              ))}

            {!estimateMode && typing && (
              <div
                className="listCard"
                style={{
                  justifySelf: "start",
                  maxWidth: "88%"
                }}
              >
                Guru is typing...
              </div>
            )}
          </div>

          {!estimateMode && (
            <div
              style={{
                padding: 14,
                borderTop: "1px solid var(--border)",
                display: "grid",
                gap: 10
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  overflowX: "auto",
                  paddingBottom: 2
                }}
              >
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="secondaryButton"
                    style={{
                      whiteSpace: "nowrap",
                      flex: "0 0 auto"
                    }}
                    onClick={() => {
                      if (prompt === "Start estimate") startEstimate();
                      else if (prompt === "Review Guru estimates" && user?.role === "admin") {
                        openGuruEstimatesReview();
                      } else if (prompt === "My estimates" && user?.role === "client") {
                        openClientEstimates();
                      } else if (prompt === "My quotes" && user?.role === "client") {
                        openClientQuotes();
                      } else submitMessage(prompt);
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submitMessage();
                }}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 8
                }}
              >
                <input
                  className="textInput"
                  placeholder="Ask Guru..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />

                <button className="primaryButton" type="submit">
                  Send
                </button>
              </form>
            </div>
          )}
        </section>
      )}
    </>
  );
}
