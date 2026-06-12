import React, { useState } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import Layout from "./components/Layout";
import PerformanceForm from "./components/PerformanceForm";
import FormatPreview from "./components/FormatPreview";
import HistoryList from "./components/HistoryList";

function AppContent() {
  const [activeTab, setActiveTab] = useState("form");
  
  const handleFormSubmitted = () => {
    setActiveTab("preview");
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      
      {/* 1. KONTEN TAB: FORM (BUAT LAPORAN) */}
      {activeTab === "form" && (
        <div className="max-w-2xl mx-auto w-full">
          <PerformanceForm onReportSubmitted={handleFormSubmitted} />
        </div>
      )}

      {/* 2. KONTEN TAB: PREVIEW WA */}
      {activeTab === "preview" && (
        <div className="max-w-xl mx-auto w-full">
          <FormatPreview />
        </div>
      )}

      {/* 3. KONTEN TAB: RIWAYAT LAPORAN */}
      {activeTab === "history" && (
        <HistoryList />
      )}

    </Layout>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
