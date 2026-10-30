// Production storage: the Vercel Blob store connected to this project (credentials come from the environment).
import { get, put, del } from '@vercel/blob';
export const blob = { get, put, del };
