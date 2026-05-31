import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import LandingPage from './pages/LandingPage';
import SetupPage from './pages/SetupPage';
import ReceiverPage from './pages/ReceiverPage';
import YesPage from './pages/YesPage';
import DashboardPage from './pages/DashboardPage';
import MyInvitesPage from './pages/MyInvitesPage';
import CardLandingPage from './pages/CardLandingPage';
import CardResponsesPage from './pages/CardResponsesPage';
import HeartParticles from './components/HeartParticles';

export default function App() {
  const location = useLocation();
  return (
    <>
      {/* Global background heart particles — visible behind the phone shell */}
      <HeartParticles count={22} />

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/ask/:id" element={<ReceiverPage />} />
          <Route path="/yes/:id" element={<YesPage />} />
          <Route path="/dashboard/:id" element={<DashboardPage />} />
          <Route path="/my-invites" element={<MyInvitesPage />} />
          <Route path="/card/:id" element={<CardLandingPage />} />
          <Route path="/card/:id/responses" element={<CardResponsesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </>
  );
}
