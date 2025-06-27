import { Config, Service } from "../types";

export const api = {
  // Services
  async getServices(): Promise<Config> {
    const response = await fetch("/api/services");
    if (!response.ok) {
      throw new Error("Failed to fetch services");
    }
    return response.json();
  },

  async createService(
    service: Omit<Service, "host_name"> & { host_name: string },
  ): Promise<void> {
    const response = await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(service),
    });
    if (!response.ok) {
      throw new Error("Failed to create service");
    }
  },

  async deleteService(ip: string, port: number): Promise<void> {
    const response = await fetch(`/api/services/${ip}/${port}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Failed to delete service");
    }
  },

  async checkServiceExists(ip: string, port: number): Promise<Service | null> {
    const response = await fetch(`/api/services/${ip}/${port}`);
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throw new Error("Failed to check service");
    }
    return response.json();
  },

  // Hosts
  async createHost(host: { name: string; ip: string }): Promise<void> {
    const response = await fetch("/api/hosts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(host),
    });
    if (!response.ok) {
      throw new Error("Failed to create host");
    }
  },

  async deleteHost(ip: string): Promise<void> {
    const response = await fetch(`/api/hosts/${ip}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Failed to delete host");
    }
  },

  // Service testing
  async testService(ip: string, port: string): Promise<{ reachable: boolean }> {
    const response = await fetch(`/check/${ip}/${port}`);
    if (!response.ok) {
      throw new Error(`Failed to test service ${ip}:${port}`);
    }
    return response.json();
  },
};
