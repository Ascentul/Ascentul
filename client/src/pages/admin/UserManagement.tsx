import { UserManagement as UserManagementComponent } from '@/components/admin/UserManagement';

export function UserManagement() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
      <UserManagementComponent />
    </div>
  );
}