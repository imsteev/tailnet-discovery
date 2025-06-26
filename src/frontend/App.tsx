import React from "react";
import TailnetServicesContainer from "./components/TailnetServicesContainer";

const App: React.FC = () => {
  return (
    <div className="font-apple-system max-w-4xl mx-auto p-5 min-h-screen">
      <h1 className="text-center text-gray-800 mb-8 text-2xl font-semibold">
        Tailnet Application Discovery
      </h1>
      <TailnetServicesContainer />
    </div>
  );
};

export default App;
