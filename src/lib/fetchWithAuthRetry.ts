export async function fetchWithAuthRetry(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const firstResponse = await fetch(input, init);

  if (firstResponse.status !== 401) {
    return firstResponse;
  }

  const refreshResponse = await fetch('/api/auth/refresh', {
    method: 'POST',
  });

  if (!refreshResponse.ok) {
    return firstResponse;
  }

  return fetch(input, init);
}