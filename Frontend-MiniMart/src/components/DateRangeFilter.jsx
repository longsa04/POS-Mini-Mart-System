import { useEffect, useState } from "react";
import { PRESETS, getPresetRange } from "../utils/datePresets";
import "./DateRangeFilter.css";

/**
 * DateRangeFilter — preset shortcuts + manual date inputs.
 *
 * Props:
 *   startDate  string  YYYY-MM-DD
 *   endDate    string  YYYY-MM-DD
 *   onChange   (startDate: string, endDate: string) => void
 */
const DateRangeFilter = ({ startDate, endDate, onChange }) => {
  const [activePreset, setActivePreset] = useState(null);

  // Highlight the matching preset when the dates change externally
  useEffect(() => {
    const match = PRESETS.find(({ key }) => {
      const range = getPresetRange(key);
      return range && range.start === startDate && range.end === endDate;
    });
    setActivePreset(match?.key ?? null);
  }, [startDate, endDate]);

  const handlePreset = (key) => {
    const range = getPresetRange(key);
    if (!range) return;
    onChange(range.start, range.end);
  };

  const handleManual = (which, value) => {
    onChange(
      which === "start" ? value : startDate,
      which === "end" ? value : endDate
    );
  };

  return (
    <div className="date-range-filter">
      <div className="date-preset-strip">
        {PRESETS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={`date-preset-btn${activePreset === key ? " active" : ""}`}
            onClick={() => handlePreset(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="date-range-inputs">
        <div className="date-range-field">
          <span className="date-range-field-label">From</span>
          <input
            type="date"
            className="form-control form-control-sm"
            value={startDate}
            max={endDate || undefined}
            onChange={(e) => handleManual("start", e.target.value)}
          />
        </div>
        <div className="date-range-field">
          <span className="date-range-field-label">To</span>
          <input
            type="date"
            className="form-control form-control-sm"
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => handleManual("end", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default DateRangeFilter;
