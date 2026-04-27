"use client";

import { useState } from "react";

type Appt = { when: string; with: string; type: string };

export function PortalAppointmentsWorkspace({ initialAppointments }: { initialAppointments: Appt[] }) {
  const [items, setItems] = useState(initialAppointments);
  const [when, setWhen] = useState("");
  const [withWho, setWithWho] = useState("");
  const [type, setType] = useState("");

  function book() {
    if (!when || !withWho.trim() || !type.trim()) return;
    setItems((prev) => [{ when, with: withWho.trim(), type: type.trim() }, ...prev]);
    setWhen("");
    setWithWho("");
    setType("");
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
        <p className="mt-1 text-sm text-gray-500">Book and manage appointments.</p>
      </div>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
        <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input value={withWho} onChange={(e) => setWithWho(e.target.value)} placeholder="Agent name" className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input value={type} onChange={(e) => setType(e.target.value)} placeholder="Appointment type" className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <button onClick={book} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Book</button>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
        {items.map((a) => (
          <div key={`${a.when}-${a.with}-${a.type}`} className="rounded-lg border border-gray-100 p-3">
            <p className="text-sm font-medium text-gray-900">{a.type}</p>
            <p className="text-xs text-gray-600">{a.when}</p>
            <p className="text-xs text-gray-600">With {a.with}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
