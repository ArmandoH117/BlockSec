import {
  Navigate,
  Route,
  Routes
} from "react-router-dom";

import {
  Layout
} from "./components/Layout";

import {
  CasesPage
} from "./pages/CasesPage";

import {
  CaseDetailPage
} from "./pages/CaseDetailPage";

import {
  EvidenceDetailPage
} from "./pages/EvidenceDetailPage";

import {
  BlockchainPage
} from "./pages/BlockchainPage";

import {
  NetworkPage
} from "./pages/NetworkPage";

export default function App() {
  return (
    <Routes>

      <Route element={<Layout />}>

        <Route
          index
          element={
            <Navigate
              to="/cases"
              replace
            />
          }
        />

        <Route
          path="/cases"
          element={<CasesPage />}
        />

        <Route
          path="/cases/:caseId"
          element={
            <CaseDetailPage />
          }
        />

        <Route
          path="/evidences/:evidenceId"
          element={
            <EvidenceDetailPage />
          }
        />

        <Route
          path="/blockchain"
          element={
            <BlockchainPage />
          }
        />

        <Route
          path="/network"
          element={
            <NetworkPage />
          }
        />

      </Route>

    </Routes>
  );
}