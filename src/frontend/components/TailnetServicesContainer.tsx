import React, { useState, useEffect, useCallback } from "react";
import ServiceGrid from "./ServiceGrid";
import ServiceModal from "./ServiceModal";

interface TailnetHost {
  name: string;
  ports: Record<string, string>;
}

interface Config {
  tailnet_hosts: Record<string, TailnetHost>;
}

interface Service {
  ip: string;
  port: number;
  name: string;
  host_name: string;
}

const TailnetServicesContainer: React.FC = () => {
  const [config, setConfig] = useState<Config>({ tailnet_hosts: {} });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [modalPrefilledData, setModalPrefilledData] = useState<{
    ip: string;
    hostName: string;
  } | null>(null);

  const loadServices = useCallback(async () => {
    try {
      const response = await fetch("/api/services");
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      console.error("Failed to load config:", error);
    }
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const handleAddService = (ip: string, hostName: string) => {
    setEditingService(null);
    setModalPrefilledData({ ip, hostName });
    setIsModalOpen(true);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setModalPrefilledData(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingService(null);
    setModalPrefilledData(null);
  };

  const handleServiceSaved = () => {
    setIsModalOpen(false);
    setEditingService(null);
    setModalPrefilledData(null);
    loadServices();
  };

  const handleTestService = async (ip: string, port: string) => {
    try {
      const response = await fetch(`/check/${ip}/${port}`);
      const result = await response.json();
      const status = result.reachable ? "reachable" : "unreachable";
      alert(`Service ${ip}:${port} is ${status}`);
    } catch (error) {
      console.error("Error testing service:", error);
      alert(`Error testing service ${ip}:${port}`);
    }
  };

  return (
    <>
      <div className="flex gap-2.5 mb-5">
        <button
          className="bg-primary-500 text-white border-none py-2.5 px-5 rounded-md cursor-pointer hover:bg-primary-600 transition-colors"
          onClick={loadServices}
        >
          Refresh Status
        </button>
      </div>

      <ServiceGrid
        config={config}
        onAddService={handleAddService}
        onEditService={handleEditService}
        onTestService={handleTestService}
        onRefreshConfig={loadServices}
      />

      {isModalOpen && (
        <ServiceModal
          editingService={editingService}
          prefilledData={modalPrefilledData}
          onClose={handleCloseModal}
          onServiceSaved={handleServiceSaved}
        />
      )}
    </>
  );
};

export default TailnetServicesContainer;
