import { MainLayout } from '@/components/layouts/MainLayout';
import { useIsAdmin } from '@/utils/useIsAdmin';
import { Lock } from 'lucide-react';

export function KnowledgePage() {
  const isAdmin = useIsAdmin();

  if (!isAdmin) {
    return (
      <MainLayout>
        <div className="max-w-[1400px] mx-auto px-12 py-8 pb-16">
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
            <p className="text-gray-600">Only administrators can access knowledge base management.</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-[1400px] mx-auto px-12 py-8 pb-16">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Knowledge Base</h1>
          <p className="text-gray-600">Manage your knowledge base and training data</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <p className="text-gray-500">Knowledge base content will be implemented here.</p>
        </div>
      </div>
    </MainLayout>
  );
}

