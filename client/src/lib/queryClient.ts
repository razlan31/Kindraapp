import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = res.statusText;
    try {
      const responseText = await res.text();
      try {
        // Try to parse as JSON first
        const errorData = JSON.parse(responseText);
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else {
          errorMessage = responseText;
        }
      } catch (jsonError) {
        // If not JSON, use the text as is
        errorMessage = responseText || res.statusText;
      }
    } catch (e) {
      errorMessage = res.statusText;
    }
    console.error('🔴 HTTP ERROR DETECTED:', {
      url: res.url,
      status: res.status,
      statusText: res.statusText,
      responseText: errorMessage,
      headers: Object.fromEntries(res.headers.entries()),
      timestamp: new Date().toISOString(),
      stack: new Error().stack
    });
    
    // Special logging for 404 errors to help debug logout issues
    if (res.status === 404) {
      console.error('🚨 404 ERROR STACKTRACE:', new Error().stack);
      console.error('🚨 404 REQUEST URL:', res.url);
      console.error('🚨 404 REQUEST TIME:', new Date().toISOString());
    }
    
    throw new Error(errorMessage);
  }
}

export async function apiRequest(
  url: string,
  method: string,
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
    console.log('🔍 API REQUEST:', queryKey[0], 'at', new Date().toISOString());
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
    
    // Check for the specific "undefined" string that causes JSON parsing errors
    if (text === 'undefined' || text.trim() === 'undefined') {
      console.error('Response is literal "undefined" string from:', res.url);
      throw new Error(`Response is undefined string from ${res.url}`);
    }
    
    try {
      return JSON.parse(text);
    } catch (error) {
      console.error('JSON parsing failed for response:', {
        url: res.url,
        status: res.status,
        contentType: res.headers.get('content-type'),
        responseText: text.substring(0, 100),
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
      staleTime: 5 * 60 * 1000, // 5 minutes to prevent stale data issues
      gcTime: 5 * 60 * 1000, // Reduced garbage collection time
      retry: 1, // Only retry once
      retryDelay: 1000, // 1 second delay between retries
    },
    mutations: {
      retry: false,
      gcTime: 0, // Don't cache mutation results
    },
  },
  logger: {
    log: () => {}, // Silence logs during logout
    warn: () => {},
    error: () => {},
  },
});
