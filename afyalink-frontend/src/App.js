import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { systemApi } from './api/systemApi';
import { initServerDate } from './utils/dateValidation';
import { TOKEN_KEY } from './utils/constants';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AppProviders } from './context/AppContext';
import AppRoutes from './routes/AppRoutes';
import ErrorBoundary from './components/common/ErrorBoundary';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30000 },
  },
});

function ServerDateBootstrap() {
  useEffect(() => {
    if (localStorage.getItem(TOKEN_KEY)) {
      initServerDate(systemApi);
    }
  }, []);
  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppProviders>
          <QueryClientProvider client={queryClient}>
            <ServerDateBootstrap />
            <AppRoutes />
            <ToastContainer
              position="top-right"
              autoClose={4000}
              hideProgressBar={false}
              closeOnClick
              pauseOnHover
              draggable
              theme="colored"
            />
          </QueryClientProvider>
        </AppProviders>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
