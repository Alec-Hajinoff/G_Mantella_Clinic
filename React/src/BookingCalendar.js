import React, { useState, useEffect, useCallback } from "react";
import "./BookingCalendar.css";

import { bookingCalendar, selectedAppointmentSlot } from "./ApiService";
import BookingDetailsForm from "./BookingDetailsForm";

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

function BookingCalendar() {
  const [startDate, setStartDate] = useState(new Date());
  const [slotsData, setSlotsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const rawWeekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(startDate);
    day.setDate(day.getDate() + i);
    return day;
  });

  const startDateStr = formatISO(rawWeekDays[0]);
  const endDateStr = formatISO(rawWeekDays[6]);

  const loadCalendarSlots = useCallback(
    async (clearMessage = true) => {
      setLoading(true);
      if (clearMessage) setMessage("");
      try {
        const response = await bookingCalendar(startDateStr, endDateStr);
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
    },
    [startDateStr, endDateStr],
  );

  useEffect(() => {
    loadCalendarSlots();

    const handleBookingUpdate = () => {
      loadCalendarSlots();
    };

    window.addEventListener("bookingUpdated", handleBookingUpdate);
    return () => {
      window.removeEventListener("bookingUpdated", handleBookingUpdate);
    };
  }, [loadCalendarSlots]);

  const handlePrevWeek = () => {
    setSelectedSlot(null);
    const prev = new Date(startDate);
    prev.setDate(prev.getDate() - 7);

    if (prev < new Date().setHours(0, 0, 0, 0)) {
      setStartDate(new Date());
    } else {
      setStartDate(prev);
    }
  };

  const handleNextWeek = () => {
    setSelectedSlot(null);
    const next = new Date(startDate);
    next.setDate(next.getDate() + 7);
    setStartDate(next);
  };

  const handleToday = () => {
    setSelectedSlot(null);
    setStartDate(new Date());
  };

  const handleSelectSlot = (slot) => {
    if (selectedSlot && selectedSlot.id === slot.id) {
      setSelectedSlot(null);
    } else {
      setSelectedSlot(slot);
    }
  };

  const handleConfirmBooking = async (details) => {
    if (!selectedSlot) return;

    setSubmitting(true);
    setMessage("");

    try {
      const payload = {
        ...details,
        slot_id: selectedSlot.id,
        service_price: details.service_price,
        service_name: details.service_name,
        consent_answers: details.consent_answers,
      };

      const response = await selectedAppointmentSlot(payload);

      if (response.status === "success" && response.url) {
        window.location.href = response.url;
      } else {
        setMessage(response.message || "Booking initiation failed.");
      }
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const workingDays = rawWeekDays.filter((day) => {
    const dateIso = formatISO(day);
    return slotsData.some((slot) => slot.date === dateIso);
  });

  const timeRows = Array.from(
    new Set(slotsData.map((s) => s.start_time)),
  ).sort();

  return (
    <div className="booking-calendar-container">
      <div className="calendar-header">
        <h4>Available Appointments</h4>
        <div className="calendar-nav">
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
          <table className="table table-bordered calendar-table">
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

                      const isSelected =
                        selectedSlot && selectedSlot.id === slot.id;

                      return (
                        <td key={dateIso}>
                          {slot.status === "available" ? (
                            <button
                              type="button"
                              className={`btn slot-btn ${
                                isSelected
                                  ? "slot-btn-selected"
                                  : "slot-btn-available"
                              }`}
                              onClick={() => handleSelectSlot(slot)}
                            >
                              {slot.start_time} - {slot.end_time}
                            </button>
                          ) : (
                            <span className="slot-booked">Booked</span>
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

      {selectedSlot && (
        <div className="mt-3">
          <div className="alert selected-slots-alert">
            <strong>Selected slot:</strong> {selectedSlot.date} (
            {selectedSlot.start_time}-{selectedSlot.end_time})
          </div>
          <BookingDetailsForm
            onConfirm={handleConfirmBooking}
            submitting={submitting}
          />
        </div>
      )}
    </div>
  );
}

export default BookingCalendar;
