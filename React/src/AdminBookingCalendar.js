import React, { useState, useEffect, useCallback } from "react";
import "./AdminBookingCalendar.css";
import { adminBookingCalendar } from "./ApiService";

import BlockUnblockActionBar from "./BlockUnblockActionBar";

const formatISO = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const formatUKDate = (date) => {
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
};

function AdminBookingCalendar() {
  const [startDate, setStartDate] = useState(new Date());
  const [slotsData, setSlotsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [message, setMessage] = useState("");

  const rawWeekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(startDate);
    day.setDate(day.getDate() + i);
    return day;
  });

  const startDateStr = formatISO(rawWeekDays[0]);
  const endDateStr = formatISO(rawWeekDays[6]);

  const loadCalendarSlots = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const response = await adminBookingCalendar(startDateStr, endDateStr);
      if (response.status === "success") {
        setSlotsData(response.slots);
      } else {
        setMessage(response.message || "Failed to load slots.");
      }
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }, [startDateStr, endDateStr]);

  useEffect(() => {
    loadCalendarSlots();
  }, [loadCalendarSlots]);

  useEffect(() => {
    const handleBookingUpdate = () => {
      loadCalendarSlots();
      setSelectedSlots([]);
    };

    window.addEventListener("bookingUpdated", handleBookingUpdate);
    return () => {
      window.removeEventListener("bookingUpdated", handleBookingUpdate);
    };
  }, [loadCalendarSlots]);

  const handlePrevWeek = () => {
    setSelectedSlots([]);
    const prev = new Date(startDate);
    prev.setDate(prev.getDate() - 7);
    if (prev < new Date().setHours(0, 0, 0, 0)) {
      setStartDate(new Date());
    } else {
      setStartDate(prev);
    }
  };

  const handleNextWeek = () => {
    setSelectedSlots([]);
    const next = new Date(startDate);
    next.setDate(next.getDate() + 7);
    setStartDate(next);
  };

  const handleToday = () => {
    setSelectedSlots([]);
    setStartDate(new Date());
  };

  const handleSelectSlot = (slot) => {
    if (slot.status === "booked") return;

    setSelectedSlots((prev) => {
      const exists = prev.some((s) => s.id === slot.id);
      if (exists) {
        return prev.filter((s) => s.id !== slot.id);
      } else {
        return [...prev, slot];
      }
    });
  };

  const workingDays = rawWeekDays.filter((day) => {
    const dateIso = formatISO(day);
    return slotsData.some((slot) => slot.date === dateIso);
  });

  const timeRows = Array.from(
    new Set(slotsData.map((s) => s.start_time)),
  ).sort();

  return (
    <div className="admin-booking-calendar-container">
      <div className="admin-calendar-header">
        <h4>Garage Schedule Overview</h4>
        <div className="admin-calendar-nav">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={handlePrevWeek}
            disabled={formatISO(startDate) <= formatISO(new Date())}
          >
            &lt; Prev
          </button>
          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            onClick={handleToday}
          >
            Today
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={handleNextWeek}
          >
            Next &gt;
          </button>
        </div>
      </div>

      <p className="fw-bold">
        Schedule for {formatUKDate(rawWeekDays[0])} -{" "}
        {formatUKDate(rawWeekDays[6])}
      </p>

      {loading && <div>Loading schedule...</div>}
      {message && <div className="text-info mb-2">{message}</div>}

      {!loading && (
        <div className="table-responsive">
          <table className="table table-bordered admin-calendar-table">
            <thead>
              <tr>
                {workingDays.map((day) => (
                  <th key={day.toISOString()}>
                    <div>
                      {day.toLocaleDateString("en-GB", { weekday: "short" })}
                    </div>
                    <small className="text-muted">{formatUKDate(day)}</small>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {workingDays.length === 0 || timeRows.length === 0 ? (
                <tr>
                  <td colSpan={workingDays.length || 1} className="text-muted">
                    No available working hours scheduled for this period.
                  </td>
                </tr>
              ) : (
                timeRows.map((time) => (
                  <tr key={time}>
                    {workingDays.map((day) => {
                      const dateIso = formatISO(day);
                      const slot = slotsData.find(
                        (s) => s.date === dateIso && s.start_time === time,
                      );

                      if (!slot) {
                        return <td key={dateIso}>-</td>;
                      }

                      const isSelected = selectedSlots.some(
                        (s) => s.id === slot.id,
                      );

                      return (
                        <td key={dateIso}>
                          {slot.status === "booked" ? (
                            <span className="admin-slot-booked">Booked</span>
                          ) : (
                            <button
                              type="button"
                              className={`btn admin-slot-btn ${
                                isSelected
                                  ? "admin-slot-selected"
                                  : slot.status === "blocked"
                                    ? "admin-slot-blocked"
                                    : "admin-slot-available"
                              }`}
                              onClick={() => handleSelectSlot(slot)}
                            >
                              {slot.start_time} - {slot.end_time}
                              {slot.status === "blocked" && " (Blocked)"}
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <BlockUnblockActionBar
        selectedSlots={selectedSlots}
        onActionCompleted={() => setSelectedSlots([])}
        onClearSelection={() => setSelectedSlots([])}
      />
    </div>
  );
}

export default AdminBookingCalendar;
