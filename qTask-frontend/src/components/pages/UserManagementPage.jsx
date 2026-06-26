import { useState, useEffect, useCallback, useMemo } from "react";
import {
  UserPlus, Pencil, Trash2, KeyRound,
  PowerOff, Power, Users, ShieldCheck, Code2, TestTube2,
} from "lucide-react";
import { clsx } from "clsx";
import { fetchAllUsers, createUser, updateUser, toggleUserStatus, deleteUser } from "../../services/api";
import { UserFormModal, ResetPasswordModal, DeleteUserModal } from "../modals/UserModal";

const ROLES = ["Admin", "ProjectManager", "Developer", "QA"];

const ROLE_COLORS = {
  Admin:          { bg: "#fef2f2", color: "#dc2626",  border: "#dc262630" },
  ProjectManager: { bg: "#f5f3ff", color: "#7c3aed",  border: "#7c3aed30" },
  Developer:      { bg: "#e8f4ff", color: "#0078D7",  border: "#0078D730" },
  QA:             { bg: "#f0fdf4", color: "#059669",  border: "#05966930" },
};

const ACTION_COLORS = {
  blue:   "text-blue-400 hover:text-blue-600 hover:bg-blue-50",
  yellow: "text-yellow-500 hover:text-yellow-700 hover:bg-yellow-50",
  orange: "text-orange-400 hover:text-orange-600 hover:bg-orange-50",
  green:  "text-green-500 hover:text-green-700 hover:bg-green-50",
  red:    "text-red-400 hover:text-red-600 hover:bg-red-50",
};

function KpiCard({ label, value, accent, sub, icon: Icon }) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-1 relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, #20476E 60%, #1C61A1)`, border: `1px solid ${accent}40` }}
    >
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-20 blur-2xl" style={{ background: accent }} />
      {Icon && <div className="absolute top-3 right-4 opacity-10"><Icon size={32} color={accent} /></div>}
      <span className="font-bold uppercase tracking-widest text-slate-300" style={{ fontSize: "var(--fs-xs)" }}>{label}</span>
      <span className="font-black text-white leading-none" style={{ fontSize: "var(--fs-2xl)" }}>{value}</span>
      {sub && <span className="text-slate-400 mt-0.5" style={{ fontSize: "var(--fs-xs)" }}>{sub}</span>}
    </div>
  );
}

function SectionCard({ title, toolbar, children }) {
  return (
    <div className="rounded-xl overflow-hidden bg-white" style={{ border: "1px solid #DCDCDC", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <div className="px-5 py-3 font-black uppercase tracking-widest text-white"
        style={{ background: "linear-gradient(90deg, #20476E, #1C61A1)", fontSize: "var(--fs-xs)" }}>
        {title}
      </div>
      {toolbar && (
        <div className="px-5 py-3 flex flex-wrap items-center gap-3"
          style={{ borderBottom: "1px solid #F0F8FF", background: "#fafbff" }}>
          {toolbar}
        </div>
      )}
      {children}
    </div>
  );
}

function Avatar({ name }) {
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
      style={{ background: "linear-gradient(135deg, #1C61A1, #0078D7)" }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function RoleBadge({ role }) {
  const cfg = ROLE_COLORS[role] ?? { bg: "#F0F8FF", color: "#20476E", border: "#DCDCDC" };
  return (
    <span className="font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
      style={{ fontSize: "var(--fs-xs)", background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
      {role}
    </span>
  );
}

function StatusBadge({ isActive }) {
  return (
    <span className="font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
      style={{
        fontSize: "var(--fs-xs)",
        ...(isActive
          ? { background: "#f0fdf4", color: "#059669", border: "1px solid #05966930" }
          : { background: "#F0F8FF", color: "#4f6070", border: "1px solid #DCDCDC" }),
      }}>
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

function ActionButton({ icon, label, onClick, color }) {
  return (
    <button onClick={onClick} title={label} className={clsx("p-1.5 rounded-lg transition-colors", ACTION_COLORS[color])}>
      {icon}
    </button>
  );
}

const filterSelectStyle = {
  border: "1px solid #DCDCDC", borderRadius: 8, padding: "5px 12px",
  fontSize: "var(--fs-xs)", fontWeight: 600, color: "#20476E", background: "#FFFFFF", cursor: "pointer",
};

export default function UserManagementPage({ currentUser }) {
  const [users,        setUsers]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [fadeIn,       setFadeIn]       = useState(false);
  const [addModal,     setAddModal]     = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [resetTarget,  setResetTarget]  = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [roleFilter,   setRoleFilter]   = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const data = await fetchAllUsers();
      setUsers(data);
      setTimeout(() => setFadeIn(true), 50);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visibleUsers = useMemo(() => {
    let result = users;
    if (roleFilter)   result = result.filter((u) => u.role === roleFilter);
    if (statusFilter) result = result.filter((u) => statusFilter === "active" ? u.isActive : !u.isActive);
    return result;
  }, [users, roleFilter, statusFilter]);

  const handleAdd          = useCallback(async (payload) => { const u = await createUser(payload); setUsers((p) => [...p, u]); }, []);
  const handleEdit         = useCallback(async (payload) => { const u = await updateUser(editTarget.id, payload); setUsers((p) => p.map((x) => (x.id === u.id ? u : x))); }, [editTarget]);
  const handleToggleStatus = useCallback(async (user)    => { const u = await toggleUserStatus(user.id, !user.isActive); setUsers((p) => p.map((x) => (x.id === u.id ? u : x))); }, []);
  const handleDelete       = useCallback(async ()        => { await deleteUser(deleteTarget.id); setUsers((p) => p.filter((u) => u.id !== deleteTarget.id)); }, [deleteTarget]);

  const activeCount = users.filter((u) => u.isActive).length;
  const devCount    = users.filter((u) => u.role === "Developer").length;
  const qaCount     = users.filter((u) => u.role === "QA").length;
  const pmCount     = users.filter((u) => u.role === "ProjectManager" || u.role === "Admin").length;

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 256 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid #0078D7", borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
          <p style={{ fontSize: "var(--fs-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#1C61A1" }}>Loading users</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif" }}>
      <div className="space-y-6 pb-10" style={{ opacity: fadeIn ? 1 : 0, transform: fadeIn ? "translateY(0)" : "translateY(8px)", transition: "opacity 0.35s ease, transform 0.35s ease" }}>

        {/* ── Page header ── */}
        <div className="flex items-end justify-between">
          <div>
            <p style={{ fontSize: "var(--fs-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#4f6070", marginBottom: 4 }}>Administration</p>
            <h1 style={{ fontSize: "var(--fs-xl)", fontWeight: 900, color: "#20476E", lineHeight: 1.1 }}>User Management</h1>
          </div>
          <button
            onClick={() => setAddModal(true)}
            className="flex items-center gap-2 text-white font-semibold rounded-xl transition hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #1C61A1, #0078D7)", border: "1px solid #0078D740", padding: "9px 18px", fontSize: "var(--fs-sm)" }}
          >
            <UserPlus size={15} /> Add User
          </button>
        </div>

        {/* ── KPI row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="Active Users"  value={activeCount} accent="#10b981" sub={`of ${users.length} total`} icon={Users}       />
          <KpiCard label="Managers"      value={pmCount}     accent="#8b5cf6" sub="admins & project managers"  icon={ShieldCheck} />
          <KpiCard label="Developers"    value={devCount}    accent="#0078D7" sub="in dev team"                icon={Code2}       />
          <KpiCard label="QA Engineers"  value={qaCount}     accent="#f59e0b" sub="in QA team"                 icon={TestTube2}   />
        </div>

        {/* ── Table ── */}
        <SectionCard
          title="All Users"
          toolbar={
            <>
              <select value={roleFilter}   onChange={(e) => setRoleFilter(e.target.value)}   style={filterSelectStyle}>
                <option value="">All roles</option>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={filterSelectStyle}>
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              {(roleFilter || statusFilter) && (
                <button onClick={() => { setRoleFilter(""); setStatusFilter(""); }}
                  style={{ fontSize: "var(--fs-xs)", fontWeight: 600, color: "#4f6070", cursor: "pointer", background: "none", border: "none" }}>
                  Clear
                </button>
              )}
            </>
          }
        >
          {error ? (
            <div style={{ padding: "64px 0", textAlign: "center", color: "#dc2626", fontSize: "var(--fs-sm)" }}>{error}</div>
          ) : visibleUsers.length === 0 ? (
            <div style={{ padding: "64px 0", textAlign: "center", color: "#4f6070", fontSize: "var(--fs-sm)" }}>No users found.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="qt-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Name", "Username", "Role", "Status", "Actions"].map((col) => (
                      <th key={col} style={{ textAlign: "left", color: "#a8ccf0" }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleUsers.map((user, i) => (
                    <tr
                      key={user.id}
                      style={{ background: i % 2 === 0 ? "#FFFFFF" : "#F0F8FF", opacity: user.isActive ? 1 : 0.45 }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#daeeff")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "#FFFFFF" : "#F0F8FF")}
                    >
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <Avatar name={user.name} />
                          <div>
                            <p style={{ fontWeight: 600, color: "#20476E", fontSize: "var(--fs-sm)" }}>{user.name}</p>
                            {user.id === currentUser.id && (
                              <p style={{ fontSize: "var(--fs-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#0078D7" }}>You</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ color: "#4f6070" }}>@{user.username}</td>
                      <td><RoleBadge role={user.role} /></td>
                      <td><StatusBadge isActive={user.isActive} /></td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <ActionButton icon={<Pencil size={14} />}  label="Edit"           onClick={() => setEditTarget(user)}   color="blue"   />
                          <ActionButton icon={<KeyRound size={14} />} label="Reset Password" onClick={() => setResetTarget(user)}  color="yellow" />
                          <ActionButton
                            icon={user.isActive ? <PowerOff size={14} /> : <Power size={14} />}
                            label={user.isActive ? "Deactivate" : "Reactivate"}
                            onClick={() => handleToggleStatus(user)}
                            color={user.isActive ? "orange" : "green"}
                          />
                          {user.id !== currentUser.id && (
                            <ActionButton icon={<Trash2 size={14} />} label="Delete" onClick={() => setDeleteTarget(user)} color="red" />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>

      {addModal    && <UserFormModal    user={null}       onSave={handleAdd}    onClose={() => setAddModal(false)}     />}
      {editTarget  && <UserFormModal    user={editTarget} onSave={handleEdit}   onClose={() => setEditTarget(null)}   />}
      {resetTarget && <ResetPasswordModal user={resetTarget}                    onClose={() => setResetTarget(null)}  />}
      {deleteTarget && <DeleteUserModal  user={deleteTarget} onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} />}
    </div>
  );
}
