import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from '../../core/api/api.config';
import { Dashboard } from '../../core/api/models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE)}/Me/Dashboard`;

  get(fromDate: string, toDate: string): Observable<Dashboard> {
    return this.http.get<Dashboard>(this.url, { params: new HttpParams().set('fromDate', fromDate).set('toDate', toDate) });
  }
}
