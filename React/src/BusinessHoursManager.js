import React, { useState } from "react";
import "./BusinessHoursManager.css";
import { businessHoursManager } from "./ApiService";

const DAYS = [
  { day_of_week: 1, label: "Monday" },
  { day_of_week: 2, label: "Tuesday" },
  { day_of_week: 3, label: "Wednesday" },
  { day_of_week: 4, label: "Thursday" },
  { day_of_week: 5, label: "Friday" },
  { day_of_week: 6, label: "Saturday" },
  { day_of_week: 7, label: "Sunday" },
];

function BusinessHoursManager() {
  const [schedule, setSchedule] = useState(
    DAYS.map((day) => ({
      day_of_week: day.day_of_week,
      open_time: "",
      close_time: "",
      selected: false,
    })),
  );

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleToggleDay = (dayOfWeek) => {
    setSchedule((prev) =>
      prev.map((item) =>
        item.day_of_week === dayOfWeek
          ? { ...item, selected: !item.selected }
          : item,
      ),
    );
  };

  const handleTimeChange = (dayOfWeek, field, value) => {
    setSchedule((prev) =>
      prev.map((item) =>
        item.day_of_week === dayOfWeek ? { ...item, [field]: value } : item,
      ),
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const selectedDays = schedule
      .filter((item) => item.selected)
      .map(({ day_of_week, open_time, close_time }) => ({
        day_of_week,
        open_time,
        close_time,
      }));

    if (selectedDays.length === 0) {
      setMessage("Please select at least one day.");
      return;
    }

    const missingTimes = selectedDays.some(
      (item) => !item.open_time || !item.close_time,
    );

    if (missingTimes) {
      setMessage(
        "Please enter both opening and closing times for all selected days.",
      );
      return;
    }

    setLoading(true);

    try {
      const response = await businessHoursManager(selectedDays);
      if (response.status === "success") {
        setMessage("Business hours saved successfully.");
        window.dispatchEvent(new CustomEvent("bookingUpdated"));
      } else {
        setMessage(response.message || "Failed to save business hours.");
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="business-hours-container">
      <h5>Business Hours</h5>
      <form onSubmit={handleSubmit}>
        {DAYS.map((day) => {
          const currentSlot = schedule.find(
            (item) => item.day_of_week === day.day_of_week,
          );

          return (
            <div key={day.day_of_week} className="day-row">
              <div className="day-checkbox">
                <input
                  type="checkbox"
                  id={`day-${day.day_of_week}`}
                  checked={currentSlot.selected}
                  onChange={() => handleToggleDay(day.day_of_week)}
                />
                <label htmlFor={`day-${day.day_of_week}`}>{day.label}</label>
              </div>

              <div className="time-inputs">
                <input
                  type="time"
                  className="form-control"
                  value={currentSlot.open_time}
                  disabled={!currentSlot.selected}
                  required={currentSlot.selected}
                  onChange={(e) =>
                    handleTimeChange(
                      day.day_of_week,
                      "open_time",
                      e.target.value,
                    )
                  }
                />
                <span>to</span>
                <input
                  type="time"
                  className="form-control"
                  value={currentSlot.close_time}
                  disabled={!currentSlot.selected}
                  required={currentSlot.selected}
                  onChange={(e) =>
                    handleTimeChange(
                      day.day_of_week,
                      "close_time",
                      e.target.value,
                    )
                  }
                />
              </div>
            </div>
          );
        })}

        {message && <div className="mt-2 text-info">{message}</div>}

        <button
          type="submit"
          className="btn btn-primary mt-3"
          disabled={loading}
        >
          {loading ? "Saving..." : "Save Hours"}
        </button>
      </form>
    </div>
  );
}

export default BusinessHoursManager;
