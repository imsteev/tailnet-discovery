import React, { useState } from "react";
import Button from "./Button";
import Modal from "./Modal";
import { useAsync } from "../hooks/useAsync";

interface HostModalProps {
  onClose: () => void;
  onHostSaved: () => void;
}

const HostModal: React.FC<HostModalProps> = ({ onClose, onHostSaved }) => {
  const [formData, setFormData] = useState({
    name: "",
    ipAddress: "",
  });
  const saveHostAsync = useAsync<void>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await saveHostAsync.execute(async () => {
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

        if (!response.ok) {
          throw new Error("Failed to add host");
        }
      });
      onHostSaved();
    } catch (error) {
      console.error("Error saving host:", error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Add New Host">
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-1.5 font-medium text-sm">Host Name:</label>
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
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saveHostAsync.loading}>
            {saveHostAsync.loading ? "Adding..." : "Add Host"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default HostModal;
