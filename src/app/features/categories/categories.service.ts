import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE, silent } from '../../core/api/api.config';
import { Category, CategoryType } from '../../core/api/models';

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE)}/Me/Categories`;

  list(): Observable<Category[]> {
    return this.http.get<Category[]>(this.url);
  }

  create(body: { categoryName: string; type: CategoryType; description?: string }): Observable<Category> {
    return this.http.post<Category>(this.url, { ...body, type: body.type === 'Income' ? 1 : 2 }, { context: silent() });
  }

  update(body: { categoryId: string; categoryName?: string; type?: CategoryType; description?: string }): Observable<Category> {
    const payload = { ...body, type: body.type ? (body.type === 'Income' ? 1 : 2) : undefined };
    return this.http.patch<Category>(this.url, payload, { context: silent() });
  }

  remove(id: string): Observable<unknown> {
    return this.http.delete(`${this.url}/${id}`, { context: silent() });
  }
}
