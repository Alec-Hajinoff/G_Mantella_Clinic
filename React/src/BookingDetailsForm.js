import React, { useState, useEffect } from "react";
import "./BookingDetailsForm.css";
import { bookingDetailsForm } from "./ApiService";

function BookingDetailsForm({ onConfirm, submitting }) {
  const [services, setServices] = useState([]);
  const [serviceId, setServiceId] = useState("");
  const [vehicleReg, setVehicleReg] = useState("");
  const [notes, setNotes] = useState("");

  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [phone, setPhone] = useState("");

  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        const response = await bookingDetailsForm();
        if (response.status === "success") {
          setServices(response.services);

          if (response.user) {
            setFirstName(response.user.first_name || "");
            setSurname(response.user.surname || "");
            setPhone(response.user.phone || "");
          }
        }
      } catch (err) {
        console.error("Failed to load booking form data:", err);
      }
    };
    fetchFormData();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!vehicleReg.trim()) {
      setErrorMessage("Vehicle registration number is required.");
      return;
    }

    if (!serviceId && !notes.trim()) {
      setErrorMessage(
        "Please either select a garage service or provide details in the notes section.",
      );
      return;
    }

    if (!firstName.trim()) {
      setErrorMessage("First name is required.");
      return;
    }

    if (!surname.trim()) {
      setErrorMessage("Surname is required.");
      return;
    }

    if (!phone.trim()) {
      setErrorMessage("Phone number is required.");
      return;
    }

    onConfirm({
      service_id: serviceId ? parseInt(serviceId, 10) : null,
      vehicle_reg: vehicleReg.trim(),
      notes: notes.trim() || null,
      first_name: firstName.trim(),
      surname: surname.trim(),
      phone: phone.trim(),
    });
  };

  const selectedService = services.find(
    (s) => s.id === parseInt(serviceId, 10),
  );

  return (
    <form className="booking-details-form" onSubmit={handleSubmit}>
      <h5 className="mb-3">Appointment Details</h5>

      {errorMessage && (
        <div className="alert alert-danger py-2">{errorMessage}</div>
      )}

      <div className="booking-form-group">
        <label className="form-label fw-bold">
          Vehicle Registration <span className="text-danger">*</span>
        </label>
        <input
          type="text"
          className="form-control"
          placeholder="e.g. AB12 CDE"
          value={vehicleReg}
          onChange={(e) => setVehicleReg(e.target.value)}
          required
        />
      </div>

      <div className="booking-form-group">
        <label className="form-label fw-bold">Select Service</label>
        <select
          className="form-select"
          value={serviceId}
          onChange={(e) => setServiceId(e.target.value)}
        >
          <option value="">
            -- Choose a Service (Optional if notes provided) --
          </option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}{" "}
              {service.duration_minutes
                ? `(${service.duration_minutes} mins)`
                : ""}
            </option>
          ))}
        </select>

        {selectedService && selectedService.duration_minutes && (
          <small className="text-muted mt-1 d-block">
            Estimated duration: {selectedService.duration_minutes} minutes
          </small>
        )}
      </div>

      <div className="booking-form-group">
        <label className="form-label fw-bold">
          Notes / Additional Requirements
        </label>
        <textarea
          className="form-control"
          rows="2"
          placeholder="Describe your issue or custom request..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="row">
        <div className="col-md-6 booking-form-group">
          <label className="form-label fw-bold">
            First Name <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className="form-control"
            placeholder="John"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </div>
        <div className="col-md-6 booking-form-group">
          <label className="form-label fw-bold">
            Surname <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className="form-control"
            placeholder="Doe"
            value={surname}
            onChange={(e) => setSurname(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="booking-form-group">
        <label className="form-label fw-bold">
          Phone Number <span className="text-danger">*</span>
        </label>
        <input
          type="tel"
          className="form-control"
          placeholder="e.g. 07123456789"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
      </div>

      <button
        type="submit"
        className="btn btn-primary btn-sm mt-2"
        disabled={submitting}
      >
        {submitting ? "Booking..." : "Confirm Booking"}
      </button>
    </form>
  );
}

export default BookingDetailsForm;
