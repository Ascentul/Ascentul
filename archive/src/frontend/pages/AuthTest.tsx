import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';

export default function AuthTest() {
  const [username, setUsername] = useState("alex");
  const [password, setPassword] = useState("password");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Function to fetch the current user
  const fetchCurrentUser = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest("GET", "/api/users/me");
      const userData = await response.json();
      setCurrentUser(userData);
      toast({
        title: "Success",
        description: "Current user fetched successfully",
      });
    } catch (error) {
      console.error("Error fetching current user:", error);
      toast({
        title: "Error",
        description: "Failed to fetch current user",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to log in
  const handleLogin = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest("POST", "/api/auth/login", {
        username,
        password,
      });
      const data = await response.json();
      setCurrentUser(data.user);
      toast({
        title: "Login successful",
        description: `Welcome back, ${data.user.name}!`,
      });
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: "Invalid username or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to log out
  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await apiRequest("POST", "/api/auth/logout");
      setCurrentUser(null);
      toast({
        title: "Logout successful",
        description: "You have been logged out",
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout failed",
        description: "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Check current user on component mount
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-2xl font-bold mb-4">Authentication Test</h1>
      
      {/* Login Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Enter your credentials to log in</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleLogin} disabled={isLoading}>
            {isLoading ? "Loading..." : "Login"}
          </Button>
        </CardFooter>
      </Card>
      
      {/* Current User Info */}
      <Card>
        <CardHeader>
          <CardTitle>Current User</CardTitle>
          <CardDescription>User data from the session</CardDescription>
        </CardHeader>
        <CardContent>
          {currentUser ? (
            <pre className="bg-slate-100 p-2 rounded overflow-auto max-h-60">
              {JSON.stringify(currentUser, null, 2)}
            </pre>
          ) : (
            <p>No user is currently logged in</p>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button onClick={fetchCurrentUser} disabled={isLoading} variant="outline">
            Refresh
          </Button>
          {currentUser && (
            <Button onClick={handleLogout} disabled={isLoading} variant="destructive">
              Logout
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}