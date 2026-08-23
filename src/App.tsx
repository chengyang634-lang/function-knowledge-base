import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import type { ReactNode } from 'react';

import AdminGuard from './components/AdminGuard';
import ThemeToggle from './components/ThemeToggle';
import {
  installAdminFetchInterceptor,
} from './lib/adminAuth';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminPage from './pages/AdminPage';
import CategoryAdminPage from './pages/CategoryAdminPage';
import EditFunctionPage from './pages/EditFunctionPage';
import FunctionAdminPage from './pages/FunctionAdminPage';
import FunctionLibraryPage from './pages/FunctionLibraryPage';
import NewFunctionPage from './pages/NewFunctionPage';
import ReviewPage from './pages/ReviewPage';
import TagAdminPage from './pages/TagAdminPage';

installAdminFetchInterceptor();

function protect(
  element: ReactNode,
) {
  return (
    <AdminGuard>
      {element}
    </AdminGuard>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeToggle />

      <Routes>
        <Route
          path="/"
          element={<FunctionLibraryPage />}
        />

        <Route
          path="/review"
          element={<ReviewPage />}
        />

        <Route
          path="/admin/login"
          element={<AdminLoginPage />}
        />

        <Route
          path="/admin"
          element={protect(<AdminPage />)}
        />

        <Route
          path="/admin/functions"
          element={protect(
            <FunctionAdminPage />,
          )}
        />

        <Route
          path="/admin/functions/new"
          element={protect(
            <NewFunctionPage />,
          )}
        />

        <Route
          path="/admin/functions/:id/edit"
          element={protect(
            <EditFunctionPage />,
          )}
        />

        <Route
          path="/admin/categories"
          element={protect(
            <CategoryAdminPage />,
          )}
        />

        <Route
          path="/admin/tags"
          element={protect(
            <TagAdminPage />,
          )}
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;