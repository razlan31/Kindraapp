import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

export default function SimpleConnectionCreate() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createConnection = async () => {
    console.log("=== CREATE CONNECTION FUNCTION CALLED ===");
    console.log("Name:", name);
    
    if (!name.trim()) {
      console.log("Name validation failed");
      alert("Please enter a name");
      return;
    }

    console.log("Setting isSubmitting to true");
    setIsSubmitting(true);
    
    try {
      console.log("About to make fetch request...");
      const response = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          relationshipStage: "Talking"
        }),
        credentials: "include"
      });
      
      console.log("Fetch response received:", response.status, response.statusText);

      if (response.ok) {
        console.log("Success! Connection created");
        alert("Connection created successfully!");
        queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
        setLocation("/connections");
      } else {
        const errorText = await response.text();
        console.log("Error response:", errorText);
        alert("Failed to create connection: " + errorText);
      }
    } catch (error) {
      console.log("Catch block error:", error);
      alert("Error: " + String(error));
    } finally {
      console.log("Setting isSubmitting to false");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6">Create Connection (Simple)</h1>
        
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter name"
            />
          </div>
          
          <button
            onClick={() => {
              console.log("TEST BUTTON CLICKED!");
              alert("Button works!");
            }}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 mb-2"
          >
            TEST BUTTON - Click Me First
          </button>
          
          <button
            onClick={createConnection}
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "Creating..." : "Create Connection"}
          </button>
          
          <button
            onClick={() => setLocation("/connections")}
            className="w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}