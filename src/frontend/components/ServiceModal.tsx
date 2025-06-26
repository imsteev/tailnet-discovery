import React, { useState, useEffect } from 'react';

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
  onServiceSaved
}) => {
  const [formData, setFormData] = useState({
    hostName: '',
    ipAddress: '',
    portNumber: '',
    serviceName: ''
  });

  useEffect(() => {
    if (editingService) {
      setFormData({
        hostName: editingService.host_name,
        ipAddress: editingService.ip,
        portNumber: editingService.port.toString(),
        serviceName: editingService.name
      });
    } else if (prefilledData) {
      setFormData({
        hostName: prefilledData.hostName,
        ipAddress: prefilledData.ip,
        portNumber: '',
        serviceName: ''
      });
    }
  }, [editingService, prefilledData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ip: formData.ipAddress,
          port: parseInt(formData.portNumber),
          name: formData.serviceName,
          host_name: formData.hostName
        })
      });

      if (response.ok) {
        onServiceSaved();
      } else {
        alert(editingService ? 'Failed to update service' : 'Failed to add service');
      }
    } catch (error) {
      console.error('Error saving service:', error);
      alert('Error saving service');
    }
  };

  const handleDelete = async () => {
    if (!editingService) return;
    
    if (!confirm(`Are you sure you want to delete the service on ${editingService.ip}:${editingService.port}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/services/${editingService.ip}/${editingService.port}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        onServiceSaved();
      } else {
        alert('Failed to delete service');
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Error deleting service');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={handleOverlayClick}>
      <div className="bg-white p-5 rounded-lg w-96 max-w-[90%]">
        <h3 className="text-lg font-semibold mb-4">{editingService ? 'Edit Service' : 'Add New Service'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-1.5 font-medium text-sm">Host Name:</label>
            <input
              type="text"
              name="hostName"
              value={formData.hostName}
              onChange={handleChange}
              required
              className="w-full p-2 border border-gray-300 rounded box-border focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1.5 font-medium text-sm">IP Address:</label>
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
              className={`w-full p-2 border border-gray-300 rounded box-border focus:outline-none ${editingService ? 'bg-gray-50' : 'focus:ring-2 focus:ring-primary-500'}`}
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1.5 font-medium text-sm">Service Name:</label>
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
              className="bg-primary-500 text-white border-none py-2 px-4 rounded cursor-pointer hover:bg-primary-600 transition-colors"
            >
              {editingService ? 'Update Service' : 'Add Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceModal;