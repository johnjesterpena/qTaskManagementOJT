import { resetUserPassword } from "../../services/api";

import { useState } from "react";

const ROLES = ["Admin", "ProjectManager", "Developer", "QA"];

const inputClass   = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";
const primaryBtn   = "px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50";
const secondaryBtn = "px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition";

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      {children}
    </div>
  );
}

function ModalShell({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.3)" }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-semibold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition text-xl leading-none"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function UserFormModal({ user, onSave, onClose }) {
  const isEdit = !!user;

  const [form, setForm] = useState({
    name:     user?.name     ?? "",
    username: user?.username ?? "",
    role:     user?.role     ?? "Developer",
    password: "",
  });
  const [error,   setError]   = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setError(null);
    if (!form.name.trim())     return setError("Name is required.");
    if (!form.username.trim()) return setError("Username is required.");
    if (!isEdit && !form.password.trim()) return setError("Password is required.");
    if (!isEdit && form.password.length < 6) return setError("Password must be at least 6 characters.");

    try {
      setLoading(true);
      const payload = isEdit
        ? { name: form.name, username: form.username, role: form.role }
        : { name: form.name, username: form.username, role: form.role, password: form.password };
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell title={isEdit ? "Edit User" : "Add User"} onClose={onClose}>
      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <Field label="Full Name">
          <input
            autoFocus
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. Juan Dela Cruz"
            className={inputClass}
          />
        </Field>

        <Field label="Username">
          <input
            name="username"
            value={form.username}
            onChange={handleChange}
            placeholder="e.g. juan"
            className={inputClass}
          />
        </Field>

        <Field label="Role">
          <select name="role" value={form.role} onChange={handleChange} className={inputClass}>
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </Field>

        {!isEdit && (
          <Field label="Password">
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Min. 6 characters"
              className={inputClass}
            />
          </Field>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className={secondaryBtn}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className={primaryBtn}>
            {loading ? "Saving…" : isEdit ? "Save Changes" : "Add User"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

export function ResetPasswordModal({ user, onClose }) {
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [error,    setError]    = useState(null);
  const [success,  setSuccess]  = useState(false);
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async () => {
    setError(null);
    if (!password.trim())     return setError("Password is required.");
    if (password.length < 6)  return setError("Password must be at least 6 characters.");
    if (password !== confirm)  return setError("Passwords do not match.");

    try {
      setLoading(true);
      await resetUserPassword(user.id, password);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell title={`Reset Password — ${user.name}`} onClose={onClose}>
      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}
        {success ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 text-green-600 text-sm rounded-lg px-4 py-3">
              Password reset successfully.
            </div>
            <div className="flex justify-end">
              <button onClick={onClose} className={primaryBtn}>Done</button>
            </div>
          </div>
        ) : (
          <>
            <Field label="New Password">
              <input
                autoFocus
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className={inputClass}
              />
            </Field>
            <Field label="Confirm Password">
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter password"
                className={inputClass}
              />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={onClose} className={secondaryBtn}>Cancel</button>
              <button onClick={handleSubmit} disabled={loading} className={primaryBtn}>
                {loading ? "Resetting…" : "Reset Password"}
              </button>
            </div>
          </>
        )}
      </div>
    </ModalShell>
  );
}

export function DeleteUserModal({ user, onConfirm, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell title="Delete User" onClose={onClose}>
      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}
        <p className="text-sm text-gray-600">
          Are you sure you want to permanently delete{" "}
          <span className="font-semibold text-gray-800">{user.name}</span>?
          This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className={secondaryBtn}>Cancel</button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition disabled:opacity-50"
          >
            {loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}