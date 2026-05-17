import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import {
  fetchExpenses,
  createExpense,
  deleteExpense,
} from "../../../api/expenses";
import DateRangeFilter from "../../../components/DateRangeFilter";

const CATEGORIES = ["UTILITIES", "SUPPLIES", "RENT", "SALARY", "OTHER"];

const CATEGORY_BADGE = {
  UTILITIES: "bg-info text-dark",
  SUPPLIES: "bg-warning text-dark",
  RENT: "bg-primary",
  SALARY: "bg-success",
  OTHER: "bg-secondary",
};

const toDateStr = (date) => date.toISOString().slice(0, 10);

const getStartOfMonth = () => {
  const d = new Date();
  return toDateStr(new Date(d.getFullYear(), d.getMonth(), 1));
};

const getToday = () => toDateStr(new Date());

const blankForm = {
  description: "",
  amount: "",
  category: "UTILITIES",
  expenseDate: "",
};

const fmt = (amount) => `$${Number(amount || 0).toFixed(2)}`;

const formatDateTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const categoryLabel = (cat) =>
  cat ? cat.charAt(0) + cat.slice(1).toLowerCase() : "Other";

const Expenses = () => {
  const { user } = useAuth();

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [showForm, setShowForm] = useState(false);
  const [filterStart, setFilterStart] = useState(getStartOfMonth);
  const [filterEnd, setFilterEnd] = useState(getToday);

  const loadExpenses = async (signal) => {
    setError(null);
    try {
      const data = await fetchExpenses({
        startDate: filterStart,
        endDate: filterEnd,
        signal,
      });
      if (signal?.aborted) return;
      setExpenses(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.message || "Unable to load expenses.");
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    loadExpenses(controller.signal).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [filterStart, filterEnd]);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(null), 3000);
    return () => clearTimeout(t);
  }, [success]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.description.trim()) {
      setError("Description is required.");
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      setError("Amount must be greater than zero.");
      return;
    }

    // datetime-local gives "YYYY-MM-DDTHH:MM" — append seconds for Java LocalDateTime
    const expenseDate = form.expenseDate ? `${form.expenseDate}:00` : null;

    const payload = {
      locationId: user?.locationId ?? 1,
      userId: user?.userId ?? null,
      description: form.description.trim(),
      amount: Number(form.amount),
      category: form.category,
      expenseDate,
    };

    setSubmitting(true);
    try {
      await createExpense(payload);
      setSuccess("Expense logged successfully.");
      setForm(blankForm);
      setShowForm(false);
      const refreshed = await fetchExpenses({
        startDate: filterStart,
        endDate: filterEnd,
      });
      setExpenses(Array.isArray(refreshed) ? refreshed : []);
    } catch (err) {
      setError(err.message || "Unable to save expense.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (expense) => {
    if (!window.confirm(`Delete "${expense.description}"?`)) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await deleteExpense(expense.expenseId);
      setSuccess("Expense deleted.");
      const refreshed = await fetchExpenses({
        startDate: filterStart,
        endDate: filterEnd,
      });
      setExpenses(Array.isArray(refreshed) ? refreshed : []);
    } catch (err) {
      setError(err.message || "Unable to delete expense.");
    } finally {
      setSubmitting(false);
    }
  };

  const totals = expenses.reduce((acc, exp) => {
    const cat = exp.category ?? "OTHER";
    acc[cat] = (acc[cat] || 0) + Number(exp.amount || 0);
    return acc;
  }, {});

  const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);

  return (
    <div className="page">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h2 className="mb-1">Expenses</h2>
          <p className="text-secondary font-12 mb-0">
            Track operating costs — utilities, supplies, rent, salaries, and more.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => {
            setShowForm((v) => !v);
            setError(null);
          }}
        >
          <i className={`fa-solid fa-fw ${showForm ? "fa-xmark" : "fa-plus"} me-1`}></i>
          {showForm ? "Cancel" : "Log Expense"}
        </button>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}
      {success && <div className="alert alert-success py-2">{success}</div>}

      {/* Add expense form */}
      {showForm && (
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-white fw-semibold">
            Log a new expense
          </div>
          <div className="card-body">
            <form className="row g-3" onSubmit={handleSubmit}>
              <div className="col-md-5">
                <label className="form-label">
                  Description <span className="text-danger">*</span>
                </label>
                <input
                  name="description"
                  className="form-control"
                  placeholder="e.g. Monthly electricity bill"
                  value={form.description}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">
                  Amount ($) <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  name="amount"
                  className="form-control"
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  value={form.amount}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">Category</label>
                <select
                  name="category"
                  className="form-select"
                  value={form.category}
                  onChange={handleChange}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {categoryLabel(c)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Date &amp; Time</label>
                <input
                  type="datetime-local"
                  name="expenseDate"
                  className="form-control"
                  value={form.expenseDate}
                  onChange={handleChange}
                />
              </div>
              <div className="col-12">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : "Save Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Date filter */}
      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <DateRangeFilter
            startDate={filterStart}
            endDate={filterEnd}
            onChange={(s, e) => {
              setFilterStart(s);
              setFilterEnd(e);
            }}
          />
          <div className="text-secondary mt-2" style={{ fontSize: "0.82rem" }}>
            {expenses.length} record{expenses.length !== 1 ? "s" : ""} — Total:{" "}
            <strong className="text-dark">{fmt(grandTotal)}</strong>
          </div>
        </div>
      </div>

      {/* Category summary pills */}
      {expenses.length > 0 && (
        <div className="d-flex flex-wrap gap-2 mb-3">
          {Object.entries(totals).map(([cat, total]) => (
            <div
              key={cat}
              className="card shadow-sm border-0 px-3 py-2 d-flex flex-row align-items-center gap-2"
            >
              <span
                className={`badge ${CATEGORY_BADGE[cat] ?? "bg-secondary"}`}
              >
                {categoryLabel(cat)}
              </span>
              <span className="fw-semibold">{fmt(total)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Expense table */}
      <div className="card shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-striped table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Recorded By</th>
                  <th className="text-end">Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center text-secondary py-4"
                    >
                      Loading expenses...
                    </td>
                  </tr>
                )}
                {!loading && expenses.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center text-secondary py-4"
                    >
                      No expenses recorded in this period.
                    </td>
                  </tr>
                )}
                {expenses.map((exp) => (
                  <tr key={exp.expenseId}>
                    <td className="font-12 text-secondary">
                      {formatDateTime(exp.expenseDate)}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          CATEGORY_BADGE[exp.category] ?? "bg-secondary"
                        }`}
                      >
                        {categoryLabel(exp.category)}
                      </span>
                    </td>
                    <td>{exp.description}</td>
                    <td className="text-secondary font-12">
                      {exp.user?.username ?? "—"}
                    </td>
                    <td className="text-end fw-semibold">{fmt(exp.amount)}</td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleDelete(exp)}
                        disabled={submitting}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Expenses;
