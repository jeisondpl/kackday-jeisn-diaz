import type { RouteObject } from 'react-router-dom';
import { DashboardPage } from './presentation/pages/DashboardPage.tsx';

export const consultaRoutes: RouteObject[] = [
  {
    index: true,
    element: <DashboardPage />,
  },
  {
    path: 'dashboard',
    element: <DashboardPage />,
  },
];
