import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import TailnetServicesContainer from "./components/TailnetServicesContainer";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="font-apple-system max-w-4xl mx-auto p-5 min-h-screen">
        <h1 className="text-center text-gray-800 mb-8 text-2xl font-semibold">
          Tailnet Application Discovery
        </h1>
        <TailnetServicesContainer />
      </div>
    </QueryClientProvider>
  );
};

export default App;
