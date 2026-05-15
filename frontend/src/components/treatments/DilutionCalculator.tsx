import React from "react";
import { formatTreatmentNumber, safeNumber } from "../../utils/treatmentHelpers";

type DilutionMode = "percent" | "ounces";

function calculatePercentMix({
  targetPercent,
  sourcePercent,
  totalGallons
}: {
  targetPercent: number;
  sourcePercent: number;
  totalGallons: number;
}) {
  if (sourcePercent <= 0 || totalGallons <= 0 || targetPercent <= 0) {
    return {
      chemicalGallons: 0,
      waterGallons: totalGallons,
      chemicalOunces: 0,
      waterOunces: totalGallons * 128
    };
  }

  const chemicalGallons = (targetPercent / sourcePercent) * totalGallons;
  const cappedChemicalGallons = Math.min(Math.max(chemicalGallons, 0), totalGallons);
  const waterGallons = Math.max(totalGallons - cappedChemicalGallons, 0);

  return {
    chemicalGallons: cappedChemicalGallons,
    waterGallons,
    chemicalOunces: cappedChemicalGallons * 128,
    waterOunces: waterGallons * 128
  };
}

function calculateOunceMix({
  ouncesPerGallon,
  totalGallons
}: {
  ouncesPerGallon: number;
  totalGallons: number;
}) {
  const chemicalOunces = Math.max(ouncesPerGallon, 0) * Math.max(totalGallons, 0);
  const totalOunces = Math.max(totalGallons, 0) * 128;
  const waterOunces = Math.max(totalOunces - chemicalOunces, 0);

  return {
    chemicalOunces,
    waterOunces,
    chemicalGallons: chemicalOunces / 128,
    waterGallons: waterOunces / 128
  };
}

export default function DilutionCalculator({
  onClose
}: {
  onClose?: () => void;
}) {
  const [dilutionMode, setDilutionMode] = React.useState<DilutionMode>("percent");
  const [sourcePercent, setSourcePercent] = React.useState("10");
  const [targetPercent, setTargetPercent] = React.useState("1");
  const [totalGallons, setTotalGallons] = React.useState("5");
  const [ouncesPerGallon, setOuncesPerGallon] = React.useState("8");

  const percentMix = calculatePercentMix({
    targetPercent: safeNumber(targetPercent),
    sourcePercent: safeNumber(sourcePercent),
    totalGallons: safeNumber(totalGallons)
  });

  const ounceMix = calculateOunceMix({
    ouncesPerGallon: safeNumber(ouncesPerGallon),
    totalGallons: safeNumber(totalGallons)
  });

  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <h2 className="panelTitle">Dilution Calculator</h2>
          <p className="brandSubtitle">
            Quick field calculator for SH percent mixes and oz-per-gallon product mixes.
          </p>
        </div>

        {onClose && (
          <button className="secondaryButton" type="button" onClick={onClose}>
            Hide Calculator
          </button>
        )}
      </div>

      <div className="buttonRow" style={{ marginBottom: 16 }}>
        <button
          className={dilutionMode === "percent" ? "primaryButton" : "secondaryButton"}
          type="button"
          onClick={() => setDilutionMode("percent")}
        >
          Percent Mix
        </button>

        <button
          className={dilutionMode === "ounces" ? "primaryButton" : "secondaryButton"}
          type="button"
          onClick={() => setDilutionMode("ounces")}
        >
          Oz Per Gallon
        </button>
      </div>

      {dilutionMode === "percent" && (
        <>
          <div className="formGrid">
            <label className="fieldLabel">
              Source Strength %
              <input
                className="textInput"
                inputMode="decimal"
                value={sourcePercent}
                onChange={(e) => setSourcePercent(e.target.value)}
                placeholder="Example: 10"
              />
            </label>

            <label className="fieldLabel">
              Target On-Surface %
              <input
                className="textInput"
                inputMode="decimal"
                value={targetPercent}
                onChange={(e) => setTargetPercent(e.target.value)}
                placeholder="Example: 1"
              />
            </label>

            <label className="fieldLabel">
              Total Mix Gallons
              <input
                className="textInput"
                inputMode="decimal"
                value={totalGallons}
                onChange={(e) => setTotalGallons(e.target.value)}
                placeholder="Example: 5"
              />
            </label>
          </div>

          <div className="statsGrid" style={{ marginTop: 16 }}>
            <div className="statCard">
              <div className="statLabel">Chemical</div>
              <div className="statValue">
                {formatTreatmentNumber(percentMix.chemicalGallons)} gal
              </div>
            </div>

            <div className="statCard">
              <div className="statLabel">Water</div>
              <div className="statValue">
                {formatTreatmentNumber(percentMix.waterGallons)} gal
              </div>
            </div>

            <div className="statCard">
              <div className="statLabel">Chemical Oz</div>
              <div className="statValue">
                {formatTreatmentNumber(percentMix.chemicalOunces)} oz
              </div>
            </div>

            <div className="statCard">
              <div className="statLabel">Water Oz</div>
              <div className="statValue">
                {formatTreatmentNumber(percentMix.waterOunces)} oz
              </div>
            </div>
          </div>
        </>
      )}

      {dilutionMode === "ounces" && (
        <>
          <div className="formGrid">
            <label className="fieldLabel">
              Ounces Product Per Gallon
              <input
                className="textInput"
                inputMode="decimal"
                value={ouncesPerGallon}
                onChange={(e) => setOuncesPerGallon(e.target.value)}
                placeholder="Example: 8"
              />
            </label>

            <label className="fieldLabel">
              Total Mix Gallons
              <input
                className="textInput"
                inputMode="decimal"
                value={totalGallons}
                onChange={(e) => setTotalGallons(e.target.value)}
                placeholder="Example: 5"
              />
            </label>
          </div>

          <div className="statsGrid" style={{ marginTop: 16 }}>
            <div className="statCard">
              <div className="statLabel">Product</div>
              <div className="statValue">
                {formatTreatmentNumber(ounceMix.chemicalOunces)} oz
              </div>
            </div>

            <div className="statCard">
              <div className="statLabel">Water</div>
              <div className="statValue">
                {formatTreatmentNumber(ounceMix.waterOunces)} oz
              </div>
            </div>

            <div className="statCard">
              <div className="statLabel">Product Gal</div>
              <div className="statValue">
                {formatTreatmentNumber(ounceMix.chemicalGallons)} gal
              </div>
            </div>

            <div className="statCard">
              <div className="statLabel">Water Gal</div>
              <div className="statValue">
                {formatTreatmentNumber(ounceMix.waterGallons)} gal
              </div>
            </div>
          </div>
        </>
      )}

      <div className="listCard" style={{ marginTop: 16 }}>
        Calculator is a field helper only. Always follow product label, company policy,
        surface testing, PPE, runoff control, plant protection, and admin-approved treatment guidance.
      </div>
    </section>
  );
}
