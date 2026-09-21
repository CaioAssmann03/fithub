import type { LoginInput, LoginResponse, RegisterTrainerInput, RegisterTrainerResponse } from '@fithub/shared-types';
import { apiFetch } from '../api-client';

export function registerTrainer(input: RegisterTrainerInput) {
  return apiFetch<RegisterTrainerResponse>('/auth/register', { method: 'POST', body: input, skipAuth: true });
}

export function login(input: LoginInput) {
  return apiFetch<LoginResponse>('/auth/login', { method: 'POST', body: input, skipAuth: true });
}
