import { useEffect } from "react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    // Immediate redirect to root
    setLocation("/");
  }, [setLocation]);
  
  return null;
}
