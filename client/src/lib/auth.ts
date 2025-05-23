import { apiRequest } from "./queryClient";
import { User } from "@shared/schema";

export async function loginUser(username: string, password: string): Promise<User> {
  const response = await apiRequest("POST", "/api/login", { username, password });
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
  const response = await apiRequest("POST", "/api/register", userData);
  return await response.json();
}

export async function logoutUser(): Promise<void> {
  await apiRequest("POST", "/api/logout");
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await apiRequest("GET", "/api/me");
    return await response.json();
  } catch (error) {
    return null;
  }
}
