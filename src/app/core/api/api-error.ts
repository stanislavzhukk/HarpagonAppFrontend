import { HttpErrorResponse } from '@angular/common/http';

export type ApiErrorKind = 'network' | 'server' | 'auth' | 'forbidden' | 'notFound' | 'client';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly kind: ApiErrorKind,
    override readonly message: string,
    readonly errors: string[],
  ) {
    super(message);
  }

  get hasServerText(): boolean {
    return this.kind !== 'network' && this.kind !== 'server' && this.message.length > 0;
  }

  static from(err: unknown): ApiError {
    if (err instanceof ApiError) return err;
    if (!(err instanceof HttpErrorResponse)) {
      return new ApiError(0, 'network', '', []);
    }
    const body = err.error as unknown;
    let message = '';
    let errors: string[] = [];
    if (body && typeof body === 'object') {
      const b = body as { message?: unknown; errors?: unknown; title?: unknown };
      if (typeof b.message === 'string') message = b.message;
      else if (typeof b.title === 'string') message = b.title;
      if (Array.isArray(b.errors)) {
        errors = b.errors.filter((e): e is string => typeof e === 'string');
      } else if (b.errors && typeof b.errors === 'object') {
        errors = Object.values(b.errors as Record<string, unknown>)
          .flatMap((v) => (Array.isArray(v) ? v : [v]))
          .filter((e): e is string => typeof e === 'string');
      }
    } else if (typeof body === 'string' && body.length < 300 && !body.trim().startsWith('<')) {
      message = body;
    }
    const kind = ApiError.kindOf(err.status);
    return new ApiError(err.status, kind, kind === 'server' || kind === 'network' ? '' : message, errors);
  }

  private static kindOf(status: number): ApiErrorKind {
    if (status === 0) return 'network';
    if (status >= 500) return 'server';
    if (status === 401) return 'auth';
    if (status === 403) return 'forbidden';
    if (status === 404) return 'notFound';
    return 'client';
  }
}
