export default function NotFound() {
  // Force immediate redirect using window.location to bypass React routing
  if (typeof window !== "undefined") {
    window.location.href = "/";
  }
  
  return null;
}
