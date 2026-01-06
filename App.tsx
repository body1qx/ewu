import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/components/auth/AuthProvider';
import AppRoutes from '@/components/routes/AppRoutes';

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="shawarmer-theme">
      <Toaster position="top-right" richColors />
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
