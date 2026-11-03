interface Context {
  request: Request;
  env: { API_UPSTREAM: string };
  params: { path?: string[] };
}

export const onRequest = async ({ request, env, params }: Context): Promise<Response> => {
  const upstream = (env.API_UPSTREAM ?? '').replace(/\/+$/, '');
  if (!upstream) {
    return new Response('API_UPSTREAM is not configured', { status: 500 });
  }
  const path = (params.path ?? []).join('/');
  const search = new URL(request.url).search;
  return fetch(new Request(`${upstream}/${path}${search}`, request));
};
