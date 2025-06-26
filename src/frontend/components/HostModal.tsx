import React, { useState } from "react";

interface HostModalProps {
  onClose: () => void;
  onHostSaved: () => void;
}

const HostModal: React.FC<HostModalProps> = ({ onClose, onHostSaved }) => {
  const [formData, setFormData] = useState({
    name: "",
    ipAddress: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/hosts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          ip: formData.ipAddress,
        }),
      });

      if (response.ok) {
        onHostSaved();
      } else {
        alert("Failed to add host");
      }
    } catch (error) {
      console.error("Error saving host:", error);
      alert("Error saving host");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
      onClick={handleOverlayClick}
    >
      <div className="bg-white p-5 rounded-lg w-96 max-w-[90%]">
        <h3 className="text-lg font-semibold mb-4">Add New Host</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-1.5 font-medium text-sm">
              Host Name:
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full p-2 border border-gray-300 rounded box-border focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1.5 font-medium text-sm">
              IP Address:
            </label>
            <input
              type="text"
              name="ipAddress"
              value={formData.ipAddress}
              onChange={handleChange}
              required
              className="w-full p-2 border border-gray-300 rounded box-border focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex gap-2.5 justify-end">
            <button
              type="button"
              className="bg-gray-500 text-white border-none py-2 px-4 rounded cursor-pointer hover:bg-gray-600 transition-colors"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-primary-500 text-white border-none py-2 px-4 rounded cursor-pointer hover:bg-primary-600 transition-colors"
            >
              Add Host
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HostModal;
