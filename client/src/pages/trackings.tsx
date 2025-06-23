import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Activities from "./activities";
import Connections from "./connections";

export default function Trackings() {
  const [activeView, setActiveView] = useState<"activities" | "connections">("activities");

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-50 dark:from-gray-900 dark:to-gray-800">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto">
          {/* Header with Toggle */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                Trackings
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Track your relationship moments and manage your connections
              </p>
            </div>
            
            {/* Toggle Switch */}
            <Tabs value={activeView} onValueChange={(value) => setActiveView(value as "activities" | "connections")} className="w-auto">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="activities" className="px-6">Activities</TabsTrigger>
                <TabsTrigger value="connections" className="px-6">Connections</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Content based on active view */}
          <Tabs value={activeView} onValueChange={(value) => setActiveView(value as "activities" | "connections")}>
            <TabsContent value="activities" className="space-y-6 mt-0">
              <Activities />
            </TabsContent>
            <TabsContent value="connections" className="space-y-6 mt-0">
              <Connections />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}