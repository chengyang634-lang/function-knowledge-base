import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import FunctionLibraryPage from './pages/FunctionLibraryPage';
import AdminPage from './pages/AdminPage';
import FunctionAdminPage from './pages/FunctionAdminPage';
import NewFunctionPage from './pages/NewFunctionPage';
import EditFunctionPage from './pages/EditFunctionPage';
import CategoryAdminPage from './pages/CategoryAdminPage';
import TagAdminPage from './pages/TagAdminPage';
import ReviewPage from './pages/ReviewPage';
import ThemeToggle from './components/ThemeToggle';

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
          path="/admin"
          element={<AdminPage />}
        />

        <Route
          path="/admin/functions"
          element={<FunctionAdminPage />}
        />

        <Route
          path="/admin/functions/new"
          element={<NewFunctionPage />}
        />

        <Route
          path="/admin/functions/:id/edit"
          element={<EditFunctionPage />}
        />

        <Route
          path="/admin/categories"
          element={<CategoryAdminPage />}
        />

        <Route
          path="/admin/tags"
          element={<TagAdminPage />}
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