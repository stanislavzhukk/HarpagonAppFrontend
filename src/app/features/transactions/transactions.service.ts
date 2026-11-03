import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE, silent } from '../../core/api/api.config';
import { DataTable, Transaction } from '../../core/api/models';

export interface TransactionQuery {
  start: number;
  length: number;
  search?: string;
  sort: 'date' | 'amount';
  dir: 'asc' | 'desc';
  categoryName?: string;
  fromDate?: string;
  toDate?: string;
  fromAmount?: number | null;
  toAmount?: number | null;
}

@Injectable({ providedIn: 'root' })
export class TransactionsService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE);
  private draw = 0;

  private url(userId?: string): string {
    return userId ? `${this.base}/Users/${userId}/Transactions` : `${this.base}/Me/Transactions`;
  }

  page(q: TransactionQuery, userId?: string): Observable<DataTable<Transaction>> {
    let p = new HttpParams()
      .set('draw', ++this.draw)
      .set('start', q.start)
      .set('length', q.length)
      .set('order[0].column', 0)
      .set('order[0].dir', q.dir)
      .set('columns[0].data', q.sort)
      .set('columns[0].orderable', true);
    if (q.search) p = p.set('search.value', q.search);
    if (q.categoryName) p = p.set('categoryName', q.categoryName);
    if (q.fromDate) p = p.set('fromDate', q.fromDate);
    if (q.toDate) p = p.set('toDate', q.toDate);
    if (q.fromAmount != null) p = p.set('fromAmount', q.fromAmount);
    if (q.toAmount != null) p = p.set('toAmount', q.toAmount);
    return this.http.get<DataTable<Transaction>>(this.url(userId), { params: p });
  }

  create(
    body: { accountId: string; categoryId: string; amount: number; description: string },
    userId?: string,
  ): Observable<Transaction> {
    return this.http.post<Transaction>(this.url(userId), body, { context: silent() });
  }

  updateAmount(transactionId: string, amount: number, userId?: string): Observable<Transaction> {
    return this.http.patch<Transaction>(this.url(userId), { transactionId, amount }, { context: silent() });
  }

  remove(id: string, userId?: string): Observable<unknown> {
    return this.http.delete(`${this.url(userId)}/${id}`, { context: silent() });
  }
}
