import React, { useState } from "react";
import { adminProductEntry } from "./ApiService";
import "./AdminProductEntry.css";

function AdminProductEntry({ onProductAdded }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price_gbp: "",
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
      dataToSend.append("price_gbp", formData.price_gbp);

      if (imageFile) {
        dataToSend.append("image", imageFile);
      }

      const result = await adminProductEntry(dataToSend);

      if (result.status === "success") {
        setStatus({ type: "success", message: result.message });
        setFormData({
          name: "",
          description: "",
          price_gbp: "",
        });
        setImageFile(null);
        e.target.reset();
        if (onProductAdded) {
          onProductAdded();
        }
      } else {
        setStatus({
          type: "danger",
          message: result.message || "Failed to add product.",
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
    <div className="admin-product-entry-card">
      <h5 className="admin-product-entry-title">Add New Products</h5>

      {status.message && (
        <div
          className={`admin-product-entry-alert admin-product-entry-alert-${status.type}`}
        >
          {status.message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="name" className="form-label">
            Product Name *
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
          <div className="col-12 mb-3">
            <label htmlFor="price_gbp" className="form-label">
              Price (£ GBP) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="form-control"
              id="price_gbp"
              name="price_gbp"
              value={formData.price_gbp}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        <div className="mb-3">
          <label htmlFor="image" className="form-label">
            Product Image
          </label>
          <input
            type="file"
            className="form-control"
            id="image"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
          />
          <div className="admin-product-entry-file-hint">
            Accepted formats: JPEG, PNG, WEBP (Max size: 5MB)
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary w-100"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Processing..." : "Create Product"}
        </button>
      </form>
    </div>
  );
}

export default AdminProductEntry;
