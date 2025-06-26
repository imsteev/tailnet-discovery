import React from 'react';

interface TailnetHost {
  name: string;
  ports: Record<string, string>;
}

interface Service {
  ip: string;
  port: number;
  name: string;
  host_name: string;
}

interface ServiceCardProps {
  ip: string;
  host: TailnetHost;
  portStatuses: Record<string, boolean>;
  onAddService: (ip: string, hostName: string) => void;
  onEditService: (service: Service) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  ip,
  host,
  portStatuses,
  onAddService,
  onEditService
}) => {
  const getStatusClass = (ip: string, port: string) => {
    const key = `${ip}:${port}`;
    const status = portStatuses[key];
    if (status === undefined) return 'px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800';
    return status ? 'px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800' : 'px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800';
  };

  const getStatusText = (ip: string, port: string) => {
    const key = `${ip}:${port}`;
    const status = portStatuses[key];
    if (status === undefined) return 'Checking...';
    return status ? 'Up' : 'Down';
  };

  return (
    <div className="bg-white my-5 p-5 rounded-lg shadow-sm">
      <div className="text-lg font-bold text-primary-500 mb-2.5">{host.name}</div>
      <div className="text-gray-500 text-sm">{ip}</div>
      <div className="mt-4">
        {Object.entries(host.ports).map(([port, name]) => (
          <div key={port} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
            <div className="flex items-center gap-2.5">
              <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-xs">{port}</span>
              <span className="font-medium">
                <a 
                  href={`http://${ip}:${port}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary-500 no-underline hover:underline"
                >
                  {name}
                </a>
                <button
                  className="bg-warning-500 text-white border-none px-2 py-1 rounded text-xs ml-2.5 cursor-pointer hover:bg-warning-600 transition-colors"
                  onClick={() => onEditService({
                    ip,
                    port: parseInt(port),
                    name,
                    host_name: host.name
                  })}
                >
                  Edit
                </button>
              </span>
            </div>
            <span className={getStatusClass(ip, port)}>
              {getStatusText(ip, port)}
            </span>
          </div>
        ))}
        <button
          className="bg-success-500 text-white border-none px-3 py-2 rounded text-xs mt-2.5 cursor-pointer hover:bg-success-600 transition-colors"
          onClick={() => onAddService(ip, host.name)}
        >
          + Add Service
        </button>
      </div>
    </div>
  );
};

export default ServiceCard;