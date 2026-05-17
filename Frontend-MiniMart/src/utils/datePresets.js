const toStr = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const offset = (base, days) => {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
};

export const PRESETS = [
  { key: "yesterday", label: "Yesterday" },
  { key: "last7days", label: "Last 7 Days" },
  { key: "thisWeek", label: "This Week" },
  { key: "lastWeek", label: "Last Week" },
  { key: "thisMonth", label: "This Month" },
  { key: "lastMonth", label: "Last Month" },
  { key: "thisYear", label: "This Year" },
];

export const getPresetRange = (key) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Days since Monday (week starts Monday): Sun=6, Mon=0, Tue=1, ...
  const dow = today.getDay();
  const daysSinceMon = dow === 0 ? 6 : dow - 1;

  switch (key) {
    case "yesterday": {
      const d = offset(today, -1);
      return { start: toStr(d), end: toStr(d) };
    }
    case "last7days":
      return { start: toStr(offset(today, -6)), end: toStr(today) };

    case "thisWeek":
      return { start: toStr(offset(today, -daysSinceMon)), end: toStr(today) };

    case "lastWeek":
      return {
        start: toStr(offset(today, -daysSinceMon - 7)),
        end: toStr(offset(today, -daysSinceMon - 1)),
      };

    case "thisMonth": {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start: toStr(start), end: toStr(today) };
    }

    case "lastMonth": {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      return { start: toStr(start), end: toStr(end) };
    }

    case "thisYear": {
      const start = new Date(today.getFullYear(), 0, 1);
      return { start: toStr(start), end: toStr(today) };
    }

    default:
      return null;
  }
};
