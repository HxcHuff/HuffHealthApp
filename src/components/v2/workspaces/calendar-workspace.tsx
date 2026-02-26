"use client";

import { useState } from "react";

type Appointment = { time: string; client: string; type: string };

const seed: Appointment[] = [
  { time: "09:00", client: "Alicia Miles", type: "Renewal Review" },
  { time: "11:30", client: "Mack Ellis", type: "Quote Follow-up" },
  { time: "14:00", client: "Sofia Quinn", type: "Policy Service" },
];

export function CalendarWorkspace() {
  const [items, setItems] = useState(seed);
  const [time, setTime] = useState("");
  const [client, setClient] = useState("");
  const [type, setType] = useState("");

  function add() {
    if (!time || !client.trim() || !type.trim()) return;
    setItems((prev) => [...prev, { time, client: client.trim(), type: type.trim() }]);
    setTime("");
    setClient("");
    setType("");
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
        <p className="mt-1 text-sm text-gray-500">Create and manage appointment slots.</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Client" className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <input value={type} onChange={(e) => setType(e.target.value)} placeholder="Type" className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <button onClick={add} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Add</button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="space-y-2">
          {items.map((appt) => (
            <div key={`${appt.time}-${appt.client}-${appt.type}`} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{appt.client}</p>
                <p className="text-xs text-gray-600">{appt.type}</p>
              </div>
              <span className="text-sm font-semibold text-blue-700">{appt.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
