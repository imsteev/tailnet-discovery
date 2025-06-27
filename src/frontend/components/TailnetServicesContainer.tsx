import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import ServiceGrid from "./ServiceGrid";
import ServiceModal from "./ServiceModal";
import HostModal from "./HostModal";
import Button from "./Button";
import { Service } from "../types";
import { api } from "../api/services";

const TailnetServicesContainer: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHostModalOpen, setIsHostModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [modalPrefilledData, setModalPrefilledData] = useState<{
    ip: string;
    hostName: string;
  } | null>(null);

  // Queries
  const {
    data: config = { tailnet_hosts: {} },
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["services"],
    queryFn: api.getServices,
  });

  // Mutations
  const deleteHostMutation = useMutation({
    mutationFn: api.deleteHost,
    onSuccess: () => {
      refetch();
    },
  });

  const testServiceMutation = useMutation({
    mutationFn: ({ ip, port }: { ip: string; port: string }) =>
      api.testService(ip, port),
  });

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
    refetch();
  };

  const handleAddHost = () => {
    setIsHostModalOpen(true);
  };

  const handleHostModalClose = () => {
    setIsHostModalOpen(false);
  };

  const handleHostSaved = () => {
    setIsHostModalOpen(false);
    refetch();
  };

  const handleDeleteHost = async (ip: string, hostName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete host "${hostName}" and all its services?`,
      )
    ) {
      return;
    }

    try {
      await deleteHostMutation.mutateAsync(ip);
    } catch (error) {
      console.error("Error deleting host:", error);
    }
  };

  const handleTestService = async (ip: string, port: string) => {
    try {
      const result = await testServiceMutation.mutateAsync({ ip, port });
      const status = result.reachable ? "reachable" : "unreachable";
      alert(`Service ${ip}:${port} is ${status}`);
    } catch (error) {
      console.error("Error testing service:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-600">Loading services...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center py-8 gap-4">
        <div className="text-red-600">Error: {(error as Error).message}</div>
        <Button onClick={() => refetch()} variant="primary">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-2.5 mb-5">
        <Button onClick={handleAddHost} size="lg">
          Add Host
        </Button>
      </div>

      <ServiceGrid
        config={config}
        onAddService={handleAddService}
        onEditService={handleEditService}
        onTestService={handleTestService}
        onDeleteHost={handleDeleteHost}
        onRefreshConfig={() => refetch()}
      />

      {isModalOpen && (
        <ServiceModal
          editingService={editingService}
          prefilledData={modalPrefilledData}
          onClose={handleCloseModal}
          onServiceSaved={handleServiceSaved}
          refetchServices={refetch}
        />
      )}

      {isHostModalOpen && (
        <HostModal
          onClose={handleHostModalClose}
          onHostSaved={handleHostSaved}
          refetchServices={refetch}
        />
      )}
    </>
  );
};

export default TailnetServicesContainer;
