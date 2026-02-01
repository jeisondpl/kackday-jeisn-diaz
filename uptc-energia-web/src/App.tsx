import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { consultaRoutes } from '@features/consulta/routes.tsx';
import { inteligenciaRoutes } from '@features/inteligencia/routes.tsx';
import { AppLayout } from '@shared/components/layout/AppLayout.tsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      ...consultaRoutes,
      ...inteligenciaRoutes,
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
