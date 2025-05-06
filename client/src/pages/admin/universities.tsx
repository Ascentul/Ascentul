import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus, School } from "lucide-react";
import AdminLayout from "@/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// Interface for university data
interface University {
  id: number;
  name: string;
  studentCount: number;
  adminCount: number;
}

export default function UniversitiesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch universities data
  const { data: universities, isLoading, isError } = useQuery({
    queryKey: ["/api/universities"],
    queryFn: async () => {
      const response = await fetch("/api/universities");
      if (!response.ok) {
        throw new Error("Failed to fetch universities");
      }
      return response.json() as Promise<University[]>;
    }
  });

  // Filter universities based on search query
  const filteredUniversities = universities?.filter(university =>
    university.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Universities</h1>
            <p className="text-gray-600 mt-1">Manage university accounts and access</p>
          </div>
          <Button className="mt-3 md:mt-0">
            <Plus className="h-4 w-4 mr-2" />
            Add University
          </Button>
        </div>

        <div className="mb-6">
          <Input
            placeholder="Search universities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : isError ? (
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-red-500 mb-2">Error loading universities</div>
              <p>There was a problem fetching university data. Please try again later.</p>
            </CardContent>
          </Card>
        ) : filteredUniversities?.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <School className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <h3 className="text-lg font-medium">No universities found</h3>
              <p className="text-gray-500 mt-1">
                {searchQuery ? "No universities match your search criteria" : "No universities have been added yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUniversities?.map((university) => (
              <Card key={university.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4 border-b">
                    <h3 className="font-semibold text-lg">{university.name}</h3>
                  </div>
                  <div className="p-4 bg-gray-50">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Students:</span>
                      <span className="font-medium">{university.studentCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Admins:</span>
                      <span className="font-medium">{university.adminCount}</span>
                    </div>
                  </div>
                  <div className="p-4 flex justify-end gap-2">
                    <Button variant="outline" size="sm">View Details</Button>
                    <Button variant="outline" size="sm">Manage Access</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}