import React, { useState, useEffect } from "react";
import "./BookingDetailsForm.css";
import { bookingDetailsForm } from "./ApiService";

function BookingDetailsForm({ onConfirm, submitting }) {
  const [services, setServices] = useState([]);
  const [serviceId, setServiceId] = useState("");
  const [selectedService, setSelectedService] = useState(null);

  const [notes, setNotes] = useState("");

  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [phone, setPhone] = useState("");

  const [consentQuestions, setConsentQuestions] = useState([]);
  const [consentAnswers, setConsentAnswers] = useState({});

  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        const response = await bookingDetailsForm();
        if (response.status === "success") {
          setServices(response.services);

          setConsentQuestions(response.consent_questions || []);

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

  const handleServiceChange = (e) => {
    const value = e.target.value;
    setServiceId(value);
    if (value) {
      const service = services.find((s) => s.id === parseInt(value, 10));
      setSelectedService(service || null);
    } else {
      setSelectedService(null);
    }
  };

  const handleConsentChange = (questionId, value) => {
    setConsentAnswers((prev) => ({
      ...prev,
      [questionId]: parseInt(value, 10),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!serviceId && !notes.trim()) {
      setErrorMessage(
        "Please either select a service or provide details in the notes section.",
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

    for (const q of consentQuestions) {
      if (consentAnswers[q.id] === undefined) {
        setErrorMessage(
          `Please answer all required consent questions: "${q.question}"`,
        );
        return;
      }
    }

    const consentAnswersPayload = consentQuestions.map((q) => ({
      question_id: q.id,
      answer: consentAnswers[q.id],
    }));

    const payload = {
      service_id: serviceId ? parseInt(serviceId, 10) : null,
      service_name: selectedService ? selectedService.name : null,
      service_price: selectedService
        ? parseFloat(selectedService.service_price)
        : null,
      stripe_price_id: selectedService ? selectedService.stripe_price_id : null,
      notes: notes.trim() || null,
      first_name: firstName.trim(),
      surname: surname.trim(),
      phone: phone.trim(),

      consent_answers: consentAnswersPayload,
    };

    onConfirm(payload);
  };

  const serviceDisplay = services.find((s) => s.id === parseInt(serviceId, 10));

  return (
    <form className="booking-details-form" onSubmit={handleSubmit}>
      <h5 className="mb-3">Appointment Details</h5>

      {errorMessage && (
        <div className="alert alert-danger py-2">{errorMessage}</div>
      )}

      <div className="booking-form-group">
        <label className="form-label fw-bold">Select Service</label>
        <select
          className="form-select"
          value={serviceId}
          onChange={handleServiceChange}
        >
          <option value="">
            -- Choose a Service (Optional if notes provided) --
          </option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}{" "}
              {service.service_price !== null &&
              service.service_price !== undefined &&
              service.service_price !== ""
                ? `- £${parseFloat(service.service_price).toFixed(2)} `
                : ""}
              {service.duration_minutes
                ? `(${service.duration_minutes} mins)`
                : ""}
            </option>
          ))}
        </select>

        {serviceDisplay && serviceDisplay.duration_minutes && (
          <small className="text-muted mt-1 d-block">
            Estimated duration: {serviceDisplay.duration_minutes} minutes
            {serviceDisplay.service_price &&
              ` | Price: £${parseFloat(serviceDisplay.service_price).toFixed(2)}`}
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
          placeholder="Describe your request or piercing placement details..."
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

      {consentQuestions.length > 0 && (
        <div className="booking-form-group mt-4">
          <label className="form-label fw-bold d-block mb-3">
            Consent & Medical History Questions{" "}
            <span className="text-danger">*</span>
          </label>
          {consentQuestions.map((q) => (
            <div key={q.id} className="mb-3 p-3 border bg-white rounded">
              <label className="form-label d-block fw-semibold mb-2">
                {q.question} <span className="text-danger">*</span>
              </label>
              <div className="form-check form-check-inline">
                <input
                  className="form-check-input"
                  type="radio"
                  name={`consent_question_${q.id}`}
                  id={`consent_${q.id}_yes`}
                  value="1"
                  checked={consentAnswers[q.id] === 1}
                  onChange={(e) => handleConsentChange(q.id, e.target.value)}
                  required
                />
                <label
                  className="form-check-label"
                  htmlFor={`consent_${q.id}_yes`}
                >
                  Yes
                </label>
              </div>
              <div className="form-check form-check-inline">
                <input
                  className="form-check-input"
                  type="radio"
                  name={`consent_question_${q.id}`}
                  id={`consent_${q.id}_no`}
                  value="0"
                  checked={consentAnswers[q.id] === 0}
                  onChange={(e) => handleConsentChange(q.id, e.target.value)}
                  required
                />
                <label
                  className="form-check-label"
                  htmlFor={`consent_${q.id}_no`}
                >
                  No
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="submit"
        className="btn btn-primary btn-sm mt-2"
        disabled={submitting}
      >
        {submitting ? "Processing..." : "Pay & Confirm Booking"}
      </button>
    </form>
  );
}

export default BookingDetailsForm;
