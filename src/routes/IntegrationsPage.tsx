import { MainLayout } from '@/components/layouts/MainLayout';

export function IntegrationsPage() {
  return (
    <MainLayout>
      <div className="max-w-[1400px] mx-auto px-12 py-8 pb-16">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Integrations</h1>
          <p className="text-gray-600">Connect with external services and APIs</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <p className="text-gray-500">Integrations content will be implemented here.</p>
        </div>
      </div>
    </MainLayout>
  );
}

