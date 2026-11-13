import { localBackend } from './local';
import { createSupabaseBackend } from './supabase';
import type { Backend } from './types';

export * from './types';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** Supabase when both keys are set (see .env.example), otherwise local mode. */
export const backend: Backend = url && key ? createSupabaseBackend(url, key) : localBackend;
