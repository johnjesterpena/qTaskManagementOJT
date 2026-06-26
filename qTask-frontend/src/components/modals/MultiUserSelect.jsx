import { useState } from "react";

export default function MultiUserSelect({
  label,
  users,
  selected = [],
  onChange,
}) {
  const [open, setOpen] = useState(false);

  const toggleUser = (id) => {
    if (selected.includes(id)) {
      onChange(selected.filter((u) => u !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const removeUser = (id) => {
    onChange(selected.filter((u) => u !== id));
  };

  const selectedUsers = users.filter((u) => selected.includes(u.id));

  return (
    <div className="space-y-2 relative">
      <label className="text-xs font-medium text-gray-500">{label}</label>

      {/* Selected Users (Chips) */}
      <div className="flex flex-wrap gap-2 border border-gray-200 rounded-lg px-2 py-2 min-h-10.5">
        {selectedUsers.length === 0 && (
          <span className="text-sm text-gray-400">Select users...</span>
        )}

        {selectedUsers.map((u) => (
          <div
            key={u.id}
            className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs"
          >
            {u.name}
            <button
              onClick={() => removeUser(u.id)}
              className="ml-1 text-blue-500 hover:text-blue-700"
            >
              x
            </button>
          </div>
        ))}
      </div>

      {/* Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="w-full text-left border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white hover:bg-gray-50"
        >
          {open ? "Close" : "Select Users"}
        </button>

        {open && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow max-h-40 overflow-auto">
            {users.map((u) => (
              <div
                key={u.id}
                onClick={() => toggleUser(u.id)}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 ${
                  selected.includes(u.id) ? "bg-blue-50" : ""
                }`}
              >
                {u.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
