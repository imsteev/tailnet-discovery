import React, { useState, useEffect } from "react";
import ServiceCard from "./ServiceCard";

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

interface ServiceGridProps {
  config: Config;
  onAddService: (ip: string, hostName: string) => void;
  onEditService: (service: Service) => void;
  onTestService: (ip: string, port: string) => void;
  onRefreshConfig: () => void;
}

const ServiceGrid: React.FC<ServiceGridProps> = ({
  config,
  onAddService,
  onEditService,
  onTestService,
}) => {
  const [portStatuses, setPortStatuses] = useState<Record<string, boolean>>({});

  const checkPort = async (ip: string, port: string): Promise<boolean> => {
    try {
      const response = await fetch(`/check/${ip}/${port}`);
      const result = await response.json();
      return result.reachable;
    } catch {
      return false;
    }
  };

  const checkAllPorts = async () => {
    const promises: Promise<void>[] = [];
    const newStatuses: Record<string, boolean> = {};

    Object.entries(config.tailnet_hosts).forEach(([ip, host]) => {
      Object.keys(host.ports).forEach((port) => {
        const key = `${ip}:${port}`;
        promises.push(
          checkPort(ip, port).then((isReachable) => {
            newStatuses[key] = isReachable;
          }),
        );
      });
    });

    await Promise.all(promises);
    setPortStatuses(newStatuses);
  };

  useEffect(() => {
    if (Object.keys(config.tailnet_hosts).length > 0) {
      checkAllPorts();
    }
  }, [config]);

  return (
    <div className="service-grid">
      {Object.entries(config.tailnet_hosts).map(([ip, host]) => (
        <ServiceCard
          key={ip}
          ip={ip}
          host={host}
          portStatuses={portStatuses}
          onAddService={onAddService}
          onEditService={onEditService}
          onTestService={onTestService}
        />
      ))}
    </div>
  );
};

export default ServiceGrid;
