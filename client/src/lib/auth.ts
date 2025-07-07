import { apiRequest } from "./queryClient";
import { User } from "@shared/schema";

export async function loginUser(username: string, password: string, rememberMe?: boolean): Promise<User> {
  const response = await apiRequest("/api/login", "POST", { username, password, rememberMe });
  return await response.json();
}

export async function registerUser(userData: {
  username: string;
  email: string;
  password: string;
  displayName?: string;
  profileImage?: string;
  zodiacSign?: string;
  loveLanguage?: string;
}): Promise<User> {
  const response = await apiRequest("/api/register", "POST", userData);
  return await response.json();
}

export function logoutUser(): void {
  console.log("🔴 AUTH.TS: Client-side logout - clearing data only (navigation handled by auth context)");
  // Clear all data immediately
  localStorage.clear();
  sessionStorage.clear();
  
  // Do not redirect here - let auth context handle navigation
  // This prevents competing navigation calls during logout
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await fetch('/api/me');
    if (response.ok) {
      const user = await response.json();
      console.log('getCurrentUser successful:', user);
      return user;
    }
    console.log('getCurrentUser failed - response not ok');
    return null;
  } catch (error) {
    console.error('getCurrentUser error:', error);
    return null;
  }
}
