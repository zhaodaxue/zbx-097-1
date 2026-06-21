import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from '@/pages/Home';
import AdminLayout from '@/components/AdminLayout';
import Dashboard from '@/pages/admin/Dashboard';
import Applications from '@/pages/admin/Applications';
import Lottery from '@/pages/admin/Lottery';
import Results from '@/pages/admin/Results';
import ArchivePage from '@/pages/admin/Archive';
import VendorHome from '@/pages/vendor/VendorHome';
import VendorResult from '@/pages/vendor/VendorResult';
import PublicDisplay from '@/pages/PublicDisplay';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="applications" element={<Applications />} />
          <Route path="lottery" element={<Lottery />} />
          <Route path="results" element={<Results />} />
          <Route path="archive" element={<ArchivePage />} />
        </Route>

        <Route path="/vendor" element={<VendorHome />} />
        <Route path="/vendor/result" element={<VendorResult />} />

        <Route path="/public-display" element={<PublicDisplay />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
