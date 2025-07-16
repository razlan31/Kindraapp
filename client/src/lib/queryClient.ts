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
    
    // Log 404 errors for debugging in production
    if (res.status === 404) {
      console.error('404 Error:', {
        url: res.url,
        method: res.method || 'GET',
        location: window.location.href,
        response: errorMessage
      });
    }
    
    throw new Error(errorMessage);
  }
}

export async function apiRequest(
  url: string,
  method: string,
  data?: unknown | undefined,
): Promise<Response> {
  console.log(`🔍 API Request to ${url} (method: ${method})`);
  console.log(`🔍 Document cookies before request: ${document.cookie}`);
  
  // INVESTIGATION #4: Frontend cookie transmission failure
  const cookieHeader = document.cookie;
  console.log('🔍 INVESTIGATION #4: Cookie transmission check:', {
    hasCookies: !!cookieHeader,
    cookieContent: cookieHeader,
    containsSessionCookie: cookieHeader.includes('connect.sid'),
    fetchCredentials: 'include'
  });
  
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  console.log(`🔍 Response status: ${res.status}`);
  console.log(`🔍 Response headers: ${JSON.stringify(Array.from(res.headers.entries()))}`);

  // Check for expired session renewal
  if (res.headers.get('X-Session-Renewed') === 'true') {
    console.log('🧹 Session renewed by server, invalidating auth cache');
    // Import queryClient dynamically to avoid circular dependency
    const { queryClient } = await import('./queryClient');
    queryClient.invalidateQueries({ queryKey: ['/api/me'] });
    queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    console.log(`🔍 Query Request to ${queryKey[0]}`);
    console.log(`🔍 Document cookies before query: ${document.cookie}`);
    
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    console.log(`🔍 Query Response status: ${res.status}`);
    console.log(`🔍 Query Response headers: ${JSON.stringify(Array.from(res.headers.entries()))}`);

    // Check for expired session renewal in query responses
    if (res.headers.get('X-Session-Renewed') === 'true') {
      console.log('🧹 Session renewed by server during query, invalidating auth cache');
      // Import queryClient dynamically to avoid circular dependency
      const { queryClient } = await import('./queryClient');
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    }

    // Log 404 errors to identify what's causing them
    if (res.status === 404) {
      console.error('🔴 404 ERROR:', {
        url: queryKey[0],
        status: res.status,
        timestamp: new Date().toISOString()
      });
    }

    // If we get 401/404 after logout, just return null silently instead of logging errors
    if ((res.status === 401 || res.status === 404) && unauthorizedBehavior === "returnNull") {
      return null;
    }

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
      refetchOnMount: false,
      refetchOnReconnect: false,
      staleTime: 5 * 60 * 1000, // 5 minutes to prevent stale data issues
      gcTime: 5 * 60 * 1000, // Reduced garbage collection time
      retry: 0, // Don't retry failed queries
      retryDelay: 0,
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
