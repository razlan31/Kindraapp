import { useAuth } from "@/contexts/auth-context";
import { useLocation } from "wouter";

export default function TestLanding() {
  const { isAuthenticated, loading, user } = useAuth();
  const [location] = useLocation();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-purple-600 mb-4">Test Landing Page</h1>
        <p className="text-gray-600 mb-8">This is a minimal test component to verify routing is working.</p>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Kindra - Relationship Insights</h2>
          <p className="text-gray-700">If you can see this, the React app is working correctly.</p>
          
          <div className="mt-6 p-4 bg-gray-100 rounded-lg text-left">
            <h3 className="font-semibold mb-2">Debug Info:</h3>
            <p><strong>Current Location:</strong> {location}</p>
            <p><strong>Auth Loading:</strong> {loading ? "Yes" : "No"}</p>
            <p><strong>Is Authenticated:</strong> {isAuthenticated ? "Yes" : "No"}</p>
            <p><strong>User:</strong> {user ? user.email : "None"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}