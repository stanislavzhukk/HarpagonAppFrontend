import { HttpErrorResponse } from '@angular/common/http';
import { ApiError } from './api-error';

const http = (status: number, error: unknown) => new HttpErrorResponse({ status, error });

describe('ApiError', () => {
  it('reads message and errors[] from the backend body', () => {
    const e = ApiError.from(http(400, { message: 'Insufficient funds.', errors: ['Amount is too high'] }));
    expect(e.kind).toBe('client');
    expect(e.hasServerText).toBe(true);
    expect(e.message).toContain('Insufficient funds.');
  });

  it('classifies by status', () => {
    expect(ApiError.from(http(0, null)).kind).toBe('network');
    expect(ApiError.from(http(401, {})).kind).toBe('auth');
    expect(ApiError.from(http(403, {})).kind).toBe('forbidden');
    expect(ApiError.from(http(404, {})).kind).toBe('notFound');
    expect(ApiError.from(http(500, {})).kind).toBe('server');
  });
});
