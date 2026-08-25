import { BrowserRouter, Routes, Route } from 'react-router-dom';
import menuRoutes from './router/routes';
import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/LoginPage';
import RequireAuth from './components/RequireAuth';
import { AuthProvider } from './context/AuthContext';

function renderMenuRoutes(routeList) {
  return routeList.map((route) => {
    const Element = route.element;
    return (
      <Route
        key={route.path ?? 'index'}
        index={route.index}
        path={route.path}
        element={<Element />}
      />
    );
  });
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <MainLayout />
              </RequireAuth>
            }
          >
            {renderMenuRoutes(menuRoutes)}
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
