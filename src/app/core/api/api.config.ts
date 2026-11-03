import { HttpContext, HttpContextToken } from '@angular/common/http';
import { InjectionToken } from '@angular/core';

export const API_BASE = new InjectionToken<string>('API_BASE', {
  providedIn: 'root',
  factory: () => '/api',
});

export const SILENT_ERRORS = new HttpContextToken<boolean>(() => false);

export const silent = () => new HttpContext().set(SILENT_ERRORS, true);
