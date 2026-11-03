import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE, silent } from '../../core/api/api.config';
import { DataTable, UserData } from '../../core/api/models';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE)}/Users`;

  page(start: number, length: number, search?: string): Observable<DataTable<UserData>> {
    let p = new HttpParams().set('draw', 1).set('start', start).set('length', length);
    if (search) p = p.set('search.value', search);
    return this.http.get<DataTable<UserData>>(this.url, { params: p });
  }

  get(id: string): Observable<UserData> {
    return this.http.get<UserData>(`${this.url}/${id}`);
  }

  remove(id: string): Observable<unknown> {
    return this.http.delete(`${this.url}/${id}`, { context: silent() });
  }
}
