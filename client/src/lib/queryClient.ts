import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    
    // Handle empty responses or non-JSON content
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      if (!text.trim()) {
        return null;
      }
      throw new Error(`Expected JSON response but got: ${contentType}`);
    }
    
    const text = await res.text();
    if (!text.trim()) {
      return null;
    }
    
    try {
      return JSON.parse(text);
    } catch (error) {
      console.error('JSON parsing failed for response:', {
        url: res.url,
        status: res.status,
        statusText: res.statusText,
        contentType: res.headers.get('content-type'),
        responseText: text,
        textLength: text.length,
        firstChars: text.substring(0, 100),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error(`Invalid JSON response from ${res.url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes instead of Infinity
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
