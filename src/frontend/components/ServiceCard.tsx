import React from "react";
import Button from "./Button";
import { TailnetHost, Service } from "../types";

interface ServiceCardProps {
  ip: string;
  host: TailnetHost;
  portStatuses: Record<string, boolean>;
  onAddService: (ip: string, hostName: string) => void;
  onEditService: (service: Service) => void;
  onTestService: (ip: string, port: string) => void;
  onDeleteHost: (ip: string, hostName: string) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  ip,
  host,
  portStatuses,
  onAddService,
  onEditService,
  onTestService,
  onDeleteHost,
}) => {
  const getStatusClass = (ip: string, port: string) => {
    const key = `${ip}:${port}`;
    const status = portStatuses[key];
    if (status === undefined)
      return "px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800";
    return status
      ? "px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
      : "px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800";
  };

  const getStatusText = (ip: string, port: string) => {
    const key = `${ip}:${port}`;
    const status = portStatuses[key];
    if (status === undefined) return "Checking...";
    return status ? "Up" : "Down";
  };

  return (
    <div className="bg-white border border-gray-300 my-5 p-5 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-2.5">
        <div className="text-lg font-bold text-primary-500">{host.name}</div>
        <Button
          variant="danger"
          size="sm"
          onClick={() => onDeleteHost(ip, host.name)}
        >
          Delete
        </Button>
      </div>
      <div className="text-gray-500 text-sm">{ip}</div>
      <div className="mt-4">
        {Object.entries(host.ports).map(([port, name]) => (
          <div
            key={port}
            className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0"
          >
            <div className="flex items-center gap-2.5">
              <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                {port}
              </span>
              <span className="font-medium">
                <a
                  href={`http://${ip}:${port}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-500 no-underline hover:underline"
                >
                  {name}
                </a>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={getStatusClass(ip, port)}>
                {getStatusText(ip, port)}
              </span>
              <Button
                variant="warning"
                size="sm"
                onClick={() =>
                  onEditService({
                    ip,
                    port: parseInt(port),
                    name,
                    host_name: host.name,
                  })
                }
              >
                Edit
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onTestService(ip, port)}
              >
                Test
              </Button>
            </div>
          </div>
        ))}
        <Button
          variant="success"
          size="sm"
          onClick={() => onAddService(ip, host.name)}
          className="mt-2.5"
        >
          + Add Service
        </Button>
      </div>
    </div>
  );
};

export default ServiceCard;
