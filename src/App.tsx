import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ClientApp from './pages/ClientApp';
import UserProfile from './pages/UserProfile';
import AdminApp from './pages/AdminApp';
import DeliveryApp from './pages/DeliveryApp';
import Maintenance from './pages/Maintenance';
import NotificationProvider from './components/NotificationProvider';

export default function App() {
  return (
    <NotificationProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ClientApp />} />
          <Route path="/perfil" element={<UserProfile />} />
          <Route path="/admin" element={<AdminApp />} />
          <Route path="/entregador" element={<DeliveryApp />} />
          <Route path="/manutencao" element={<Maintenance />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </NotificationProvider>
  );
}
