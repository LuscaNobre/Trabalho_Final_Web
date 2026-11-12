import { Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import BookingPage from './pages/BookingPage';
import AccountPage from './pages/AccountPage';
import AdminPage from './pages/AdminPage';

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.slice(1));
      if (target) { target.scrollIntoView({ behavior: 'smooth' }); return; }
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, hash]);
  return null;
}

export default function App() {
  const location = useLocation();
  const isAuth = location.pathname === '/entrar';
  return <><ScrollToTop />{!isAuth && <Navbar />}<Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/agendar" element={<BookingPage />} />
    <Route path="/entrar" element={<AuthPage />} />
    <Route path="/minha-conta" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
    <Route path="/admin" element={<ProtectedRoute admin><AdminPage /></ProtectedRoute>} />
    <Route path="*" element={<HomePage />} />
  </Routes>{!isAuth && <Footer />}</>;
}
