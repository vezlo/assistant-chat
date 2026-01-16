import { useState, useEffect, useRef } from 'react';
import { MainLayout } from '@/components/layouts/MainLayout';
import { useApp } from '@/contexts/AppContext';
import { useIsAdmin } from '@/utils/useIsAdmin';
import { getTeamMembers, createTeamMember, updateTeamMember, deleteTeamMember, type TeamMember, type CreateTeamMemberInput, type UpdateTeamMemberInput } from '@/api/team';
import { InviteFormModal } from '@/components/team/InviteFormModal';
import { EditFormModal } from '@/components/team/EditFormModal';
import { TeamMembersTable } from '@/components/team/TeamMembersTable';
import toast, { Toaster } from 'react-hot-toast';
import { Users, UserPlus, Search } from 'lucide-react';
import { LoadingState } from '@/components/ui/LoadingState';

export function TeamPage() {
  const { user, token } = useApp();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isAdmin = useIsAdmin();
  const currentUserEmail = user?.email;

  useEffect(() => {
    loadMembers();
  }, [page, search]);

  // Debounce search input
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchInput]);

  const loadMembers = async () => {
    const companyUuid = user?.profile?.company_uuid;
    if (!companyUuid || !token) return;

    try {
      setLoading(true);
      const result = await getTeamMembers(token, companyUuid, {
        search: search || undefined,
        page,
        limit
      });
      setMembers(result.members);
      setTotal(result.total);
    } catch (error: any) {
      console.error('Failed to load team members:', error);
      toast.error(error.message || 'Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (formData: CreateTeamMemberInput) => {
    const companyUuid = user?.profile?.company_uuid;
    if (!companyUuid || !token) return;

    try {
      setSaving(true);
      await createTeamMember(token, companyUuid, formData);
      toast.success('Team member invited successfully');
      setShowInviteForm(false);
      await loadMembers();
    } catch (error: any) {
      console.error('Failed to invite team member:', error);
      toast.error(error.message || 'Failed to invite team member');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (memberUuid: string, formData: UpdateTeamMemberInput) => {
    const companyUuid = user?.profile?.company_uuid;
    if (!companyUuid || !token) return;

    try {
      setSaving(true);
      await updateTeamMember(token, companyUuid, memberUuid, formData);
      toast.success('Team member updated successfully');
      setEditingMember(null);
      await loadMembers();
    } catch (error: any) {
      console.error('Failed to update team member:', error);
      toast.error(error.message || 'Failed to update team member');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (memberUuid: string, memberName: string, memberEmail: string) => {
    if (memberEmail === currentUserEmail) {
      toast.error('You cannot delete yourself');
      return;
    }

    if (!confirm(`Are you sure you want to remove ${memberName} from the team?`)) return;

    const companyUuid = user?.profile?.company_uuid;
    if (!companyUuid || !token) return;

    try {
      setSaving(true);
      await deleteTeamMember(token, companyUuid, memberUuid);
      toast.success('Team member removed successfully');
      await loadMembers();
    } catch (error: any) {
      console.error('Failed to delete team member:', error);
      toast.error(error.message || 'Failed to remove team member');
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <MainLayout>
      <Toaster position="top-right" />
      <div className="max-w-[1400px] mx-auto px-12 py-8 pb-16">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Team Management</h1>
            <p className="text-gray-600">Manage your team members and their roles</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowInviteForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Invite Member
            </button>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          {/* Search Bar */}
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search team members by name or email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md"
              />
            </div>
          </div>

          {/* Team Members List */}
          {loading ? (
            <LoadingState message="Loading team members..." />
          ) : members.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No team members found</p>
            </div>
          ) : (
            <>
              <TeamMembersTable
                members={members}
                isAdmin={isAdmin}
                currentUserEmail={currentUserEmail}
                saving={saving}
                onEdit={setEditingMember}
                onDelete={handleDelete}
              />

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} members
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-700">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Invite Form Modal */}
        {showInviteForm && (
          <InviteFormModal
            onClose={() => setShowInviteForm(false)}
            onSave={handleInvite}
            saving={saving}
          />
        )}

        {/* Edit Form Modal */}
        {editingMember && (
          <EditFormModal
            member={editingMember}
            onClose={() => setEditingMember(null)}
            onSave={(data) => handleUpdate(editingMember.uuid, data)}
            saving={saving}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            currentUserEmail={currentUserEmail}
          />
        )}
      </div>
    </MainLayout>
  );
}
