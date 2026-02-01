import type { RouteObject } from 'react-router-dom';
import { InteligenciaPage } from './presentation/pages/InteligenciaPage.tsx';
import { ChatbotPage } from './presentation/pages/ChatbotPage.tsx';
import { KnowledgeBasePage } from './presentation/pages/KnowledgeBasePage.tsx';

export const inteligenciaRoutes: RouteObject[] = [
  {
    path: 'inteligencia',
    element: <InteligenciaPage />,
  },
  {
    path: 'llm',
    element: <InteligenciaPage />,
  },
  {
    path: 'chatbot',
    element: <ChatbotPage />,
  },
  {
    path: 'knowledge',
    element: <KnowledgeBasePage />,
  },
];
