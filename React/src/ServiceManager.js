import React, { useState } from "react";
import "./ServiceManager.css";
import { serviceManager } from "./ApiService";

function ServiceManager({ onServiceAdded }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    service_price: "",
    duration_minutes: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "", message: "" });
    setIsSubmitting(true);

    try {
      const dataToSend = new FormData();
      dataToSend.append("name", formData.name);
      dataToSend.append("description", formData.description);
      dataToSend.append("service_price", formData.service_price);
      dataToSend.append("duration_minutes", formData.duration_minutes);

      if (imageFile) {
        dataToSend.append("image", imageFile);
      }

      const result = await serviceManager(dataToSend);

      if (result.status === "success") {
        setStatus({ type: "success", message: result.message });

        setFormData({
          name: "",
          description: "",
          service_price: "",
          duration_minutes: "",
        });
        setImageFile(null);
        e.target.reset();
        if (onServiceAdded) {
          onServiceAdded();
        }
      } else {
        setStatus({
          type: "danger",
          message: result.message || "Failed to add service.",
        });
      }
    } catch (err) {
      setStatus({
        type: "danger",
        message: "An error occurred while connecting to the server.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="service-manager-container">
      <h5>Add New Service</h5>

      {status.message && (
        <div className={`alert alert-${status.type}`}>{status.message}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="name" className="form-label">
            Service Name <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className="form-control"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="description" className="form-label">
            Description
          </label>
          <textarea
            className="form-control"
            id="description"
            name="description"
            rows="3"
            value={formData.description}
            onChange={handleInputChange}
          ></textarea>
        </div>

        <div className="row">
          <div className="col-md-6 mb-3">
            <label htmlFor="service_price" className="form-label">
              Price (£ GBP) <span className="text-danger">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="form-control"
              id="service_price"
              name="service_price"
              value={formData.service_price}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="col-md-6 mb-3">
            <label htmlFor="duration_minutes" className="form-label">
              Duration (Minutes) <span className="text-danger">*</span>
            </label>
            <input
              type="number"
              className="form-control"
              id="duration_minutes"
              name="duration_minutes"
              min="1"
              value={formData.duration_minutes}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        <div className="mb-3">
          <label htmlFor="image" className="form-label">
            Service Image
          </label>
          <input
            type="file"
            className="form-control"
            id="image"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
          />
          <div className="form-text">
            Accepted formats: JPEG, PNG, WEBP (Max size: 5MB)
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary w-100"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Processing..." : "Create Service"}
        </button>
      </form>
    </div>
  );
}

export default ServiceManager;
