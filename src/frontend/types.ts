export interface TailnetHost {
  name: string;
  ports: Record<string, string>;
}

export interface Config {
  tailnet_hosts: Record<string, TailnetHost>;
}

export interface Service {
  ip: string;
  port: number;
  name: string;
  host_name: string;
}
