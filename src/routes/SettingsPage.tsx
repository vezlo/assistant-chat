import { MainLayout } from '@/components/layouts/MainLayout';
import { useIsAdmin } from '@/utils/useIsAdmin';
import { Lock, User, Key } from 'lucide-react';

export function SettingsPage() {
  const isAdmin = useIsAdmin();

  if (!isAdmin) {
    return (
      <MainLayout>
        <div className="max-w-[1400px] mx-auto px-12 py-8 pb-16">
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
            <p className="text-gray-600">Only administrators can access settings.</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-[1400px] mx-auto px-12 py-8 pb-16">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account and workspace preferences</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <User className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Account Management</h2>
            </div>
            <p className="text-gray-600 mb-4">
              You can manage your account details (name, password) from the{' '}
              <a href="/team" className="text-emerald-600 hover:text-emerald-700 underline">
                Team Management
              </a>{' '}
              page. As an admin, you can edit your own profile by clicking the edit icon next to your name in the team members list.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> For security reasons, you cannot change your own role or status. 
                Only other administrators can modify these settings for you.
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center gap-3 mb-4">
              <Key className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Workspace Settings</h2>
            </div>
            <p className="text-gray-600">
              Additional workspace settings and preferences will be available here in future updates.
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
