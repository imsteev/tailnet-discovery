import React, { useState, useEffect } from "react";
import ServiceGrid from "./components/ServiceGrid";
import ServiceModal from "./components/ServiceModal";

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

const App: React.FC = () => {
  const [config, setConfig] = useState<Config>({ tailnet_hosts: {} });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [modalPrefilledData, setModalPrefilledData] = useState<{
    ip: string;
    hostName: string;
  } | null>(null);

  const loadConfig = async () => {
    try {
      const response = await fetch("/api/config");
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      console.error("Failed to load config:", error);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

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
    loadConfig();
  };

  return (
    <div className="font-apple-system max-w-4xl mx-auto p-5 min-h-screen">
      <h1 className="text-center text-gray-800 mb-8 text-2xl font-semibold">
        Tailnet Application Discovery
      </h1>
      <div className="flex gap-2.5 mb-5">
        <button
          className="bg-primary-500 text-white border-none py-2.5 px-5 rounded-md cursor-pointer hover:bg-primary-600 transition-colors"
          onClick={loadConfig}
        >
          Refresh Status
        </button>
      </div>

      <ServiceGrid
        config={config}
        onAddService={handleAddService}
        onEditService={handleEditService}
        onRefreshConfig={loadConfig}
      />

      {isModalOpen && (
        <ServiceModal
          editingService={editingService}
          prefilledData={modalPrefilledData}
          onClose={handleCloseModal}
          onServiceSaved={handleServiceSaved}
        />
      )}
    </div>
  );
};

export default App;
