import { useAuth } from "@/contexts/auth-context";

export default function ProfileTest() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (!user) {
    return <div className="p-4">No user found</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-4">
      <h1 className="text-2xl font-bold mb-4">Profile Test</h1>
      <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg">
        <p>User: {user.displayName}</p>
        <p>Email: {user.email}</p>
        <p>Zodiac: {user.zodiacSign}</p>
      </div>
    </div>
  );
}