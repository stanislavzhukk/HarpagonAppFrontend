import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE, silent } from '../../core/api/api.config';
import { Account } from '../../core/api/models';

@Injectable({ providedIn: 'root' })
export class AccountsService {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE)}/Me/Accounts`;

  list(): Observable<Account[]> {
    return this.http.get<Account[]>(this.url);
  }

  create(body: { accountName: string; initialBalance: number; initialGoal: number }): Observable<Account> {
    return this.http.post<Account>(this.url, body, { context: silent() });
  }

  setBalance(accountId: string, newBalance: number): Observable<Account> {
    return this.http.patch<Account>(this.url, { accountId, newBalance }, { context: silent() });
  }

  setGoal(accountId: string, newGoal: number): Observable<Account> {
    return this.http.patch<Account>(`${this.url}/goal`, { accountId, newGoal }, { context: silent() });
  }

  remove(id: string): Observable<unknown> {
    return this.http.delete(`${this.url}/${id}`, { context: silent() });
  }
}
