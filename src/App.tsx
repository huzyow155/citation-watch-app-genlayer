import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "./context/WalletContext";
import { Header } from "./components/Header";
import { Landing } from "./pages/Landing";
import { Workbench } from "./pages/Workbench";

export const App: React.FC = () => {
  return (
    <WalletProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/app" element={<Workbench />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </WalletProvider>
  );
};

export default App;
