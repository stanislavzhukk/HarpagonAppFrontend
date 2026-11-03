interface Env {
  API_UPSTREAM: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const upstream = env.API_UPSTREAM.replace(/\/+$/, '');
    const path = url.pathname.replace(/^\/api/, '');
    return fetch(new Request(`${upstream}${path}${url.search}`, request));
  },
};
