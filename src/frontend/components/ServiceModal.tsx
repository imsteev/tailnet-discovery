import React, { useState, useEffect } from "react";

interface Service {
  ip: string;
  port: number;
  name: string;
  host_name: string;
}

interface ServiceModalProps {
  editingService: Service | null;
  prefilledData: { ip: string; hostName: string } | null;
  onClose: () => void;
  onServiceSaved: () => void;
}

const ServiceModal: React.FC<ServiceModalProps> = ({
  editingService,
  prefilledData,
  onClose,
  onServiceSaved,
}) => {
  const [formData, setFormData] = useState({
    hostName: "",
    ipAddress: "",
    portNumber: "",
    serviceName: "",
  });
  const [portError, setPortError] = useState<string | null>(null);
  const [portSuccess, setPortSuccess] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(
    null,
  );

  useEffect(() => {
    if (editingService) {
      setFormData({
        hostName: editingService.host_name,
        ipAddress: editingService.ip,
        portNumber: editingService.port.toString(),
        serviceName: editingService.name,
      });
    } else if (prefilledData) {
      setFormData({
        hostName: prefilledData.hostName,
        ipAddress: prefilledData.ip,
        portNumber: "",
        serviceName: "",
      });
    }
  }, [editingService, prefilledData]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [debounceTimeout]);

  const validatePort = async (ip: string, port: string) => {
    if (!port || !ip) {
      setPortError(null);
      setPortSuccess(null);
      return true;
    }

    // Skip validation if editing the same service
    if (
      editingService &&
      editingService.ip === ip &&
      editingService.port.toString() === port
    ) {
      setPortError(null);
      setPortSuccess(null);
      return true;
    }

    setIsValidating(true);
    try {
      const response = await fetch(`/api/services/${ip}/${port}`);
      if (response.status === 200) {
        // Service exists - get the service details
        const existingService = await response.json();
        setPortError(
          `Port ${port} is already in use by "${existingService.name}"`,
        );
        setPortSuccess(null);
        setIsValidating(false);
        return false;
      } else if (response.status === 404) {
        // Service doesn't exist - good
        setPortError(null);
        setPortSuccess(`Port ${port} is available`);
        setIsValidating(false);
        return true;
      }
    } catch (error) {
      console.error("Error validating port:", error);
    }
    setIsValidating(false);
    setPortError(null);
    setPortSuccess(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate port before submitting
    const isPortValid = await validatePort(
      formData.ipAddress,
      formData.portNumber,
    );
    if (!isPortValid) {
      return;
    }

    try {
      const response = await fetch("/api/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ip: formData.ipAddress,
          port: parseInt(formData.portNumber),
          name: formData.serviceName,
          host_name: formData.hostName,
        }),
      });

      if (response.ok) {
        onServiceSaved();
      } else {
        alert(
          editingService ? "Failed to update service" : "Failed to add service",
        );
      }
    } catch (error) {
      console.error("Error saving service:", error);
      alert("Error saving service");
    }
  };

  const handleDelete = async () => {
    if (!editingService) return;

    if (
      !confirm(
        `Are you sure you want to delete the service on ${editingService.ip}:${editingService.port}?`,
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/services/${editingService.ip}/${editingService.port}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        onServiceSaved();
      } else {
        alert("Failed to delete service");
      }
    } catch (error) {
      console.error("Error deleting service:", error);
      alert("Error deleting service");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFormData = {
      ...formData,
      [e.target.name]: e.target.value,
    };
    setFormData(newFormData);

    // Validate port when it changes (debounced)
    if (e.target.name === "portNumber" && !editingService) {
      // Clear existing timeout
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }

      // Clear previous validation states immediately
      setPortError(null);
      setPortSuccess(null);

      // Set new timeout
      const timeoutId = setTimeout(() => {
        validatePort(newFormData.ipAddress, newFormData.portNumber);
        setDebounceTimeout(null);
      }, 500);

      setDebounceTimeout(timeoutId);
    }
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
        <h3 className="text-lg font-semibold mb-4">
          {editingService ? "Edit Service" : "Add New Service"}
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-1.5 font-medium text-sm">
              Host Name:
            </label>
            <input
              type="text"
              name="hostName"
              value={formData.hostName}
              onChange={handleChange}
              required
              readOnly
              className="w-full p-2 border border-gray-300 rounded box-border bg-gray-50 focus:outline-none"
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
              readOnly
              className="w-full p-2 border border-gray-300 rounded box-border bg-gray-50 focus:outline-none"
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1.5 font-medium text-sm">Port:</label>
            <input
              type="number"
              name="portNumber"
              value={formData.portNumber}
              onChange={handleChange}
              required
              readOnly={!!editingService}
              className={`w-full p-2 border rounded box-border focus:outline-none ${
                editingService
                  ? "bg-gray-50 border-gray-300"
                  : portError
                    ? "border-red-500 focus:ring-2 focus:ring-red-500"
                    : portSuccess
                      ? "border-green-500 focus:ring-2 focus:ring-green-500"
                      : "border-gray-300 focus:ring-2 focus:ring-primary-500"
              }`}
            />
            {portError && (
              <p className="text-red-500 text-sm mt-1">{portError}</p>
            )}
            {portSuccess && (
              <p className="text-green-500 text-sm mt-1">{portSuccess}</p>
            )}
            {isValidating && (
              <p className="text-gray-500 text-sm mt-1">
                Checking availability...
              </p>
            )}
          </div>
          <div className="mb-4">
            <label className="block mb-1.5 font-medium text-sm">
              Service Name:
            </label>
            <input
              type="text"
              name="serviceName"
              value={formData.serviceName}
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
            {editingService && (
              <button
                type="button"
                className="bg-danger-500 text-white border-none py-2 px-4 rounded cursor-pointer hover:bg-danger-600 transition-colors"
                onClick={handleDelete}
              >
                Delete
              </button>
            )}
            <button
              type="submit"
              disabled={!!portError || isValidating}
              className={`py-2 px-4 rounded border-none transition-colors ${
                portError || isValidating
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : "bg-primary-500 text-white cursor-pointer hover:bg-primary-600"
              }`}
            >
              {editingService ? "Update Service" : "Add Service"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceModal;
