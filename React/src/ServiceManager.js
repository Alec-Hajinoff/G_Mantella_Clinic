import React, { useState } from "react";
import "./ServiceManager.css";
import { serviceManager } from "./ApiService";

function ServiceManager() {
  const [services, setServices] = useState([
    { name: "", duration_minutes: "" },
  ]);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddService = () => {
    setServices((prev) => [...prev, { name: "", duration_minutes: "" }]);
  };

  const handleRemoveService = (index) => {
    if (services.length === 1) return;
    setServices((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChange = (index, field, value) => {
    setServices((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const isValid = services.every(
      (s) =>
        s.name.trim() !== "" &&
        s.duration_minutes !== "" &&
        Number(s.duration_minutes) > 0,
    );

    if (!isValid) {
      setMessage(
        "Please complete all required fields (Name and Duration in minutes).",
      );
      return;
    }

    setLoading(true);

    try {
      const response = await serviceManager(services);
      if (response.status === "success") {
        setMessage("Services saved successfully.");

        setServices([{ name: "", duration_minutes: "" }]);
      } else {
        setMessage(response.message || "Failed to save services.");
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="service-manager-container">
      <h5>Garage Services Manager</h5>
      <form onSubmit={handleSubmit}>
        {services.map((service, index) => (
          <div key={index} className="service-card">
            <div className="service-card-header">
              <span className="fw-bold">Service #{index + 1}</span>
              {services.length > 1 && (
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => handleRemoveService(index)}
                >
                  Remove
                </button>
              )}
            </div>

            <div className="service-form-row">
              <div className="service-field-group">
                <label className="form-label">
                  Service Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={service.name}
                  required
                  onChange={(e) => handleChange(index, "name", e.target.value)}
                />
              </div>

              <div className="service-field-group">
                <label className="form-label">
                  Duration (Minutes) <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  className="form-control"
                  min="1"
                  value={service.duration_minutes}
                  required
                  onChange={(e) =>
                    handleChange(index, "duration_minutes", e.target.value)
                  }
                />
              </div>
            </div>
          </div>
        ))}

        <div className="d-flex gap-2 align-items-center mt-3">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={handleAddService}
          >
            + Add Another Service
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Saving..." : "Save Services"}
          </button>
        </div>

        {message && <div className="mt-3 text-info">{message}</div>}
      </form>
    </div>
  );
}

export default ServiceManager;
