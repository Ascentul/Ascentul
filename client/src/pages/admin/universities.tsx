import AdminLayout from "@/layouts/AdminLayout";

export default function UniversitiesPage() {
  return (
    <AdminLayout title="Universities">
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Universities</h1>
        <p className="text-gray-600">This is where you'll manage university accounts.</p>
      </div>
    </AdminLayout>
  );
}