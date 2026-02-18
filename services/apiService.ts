
import { GuestMessage, MediaSchemeData, MediaItem, VoteOption, Voter, PresignedUploadResponse, DisplaySettings } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function putJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function patchJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function deleteJsonReq<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

// --- Read APIs ---

export async function fetchMessages(): Promise<GuestMessage[]> {
  return fetchJson<GuestMessage[]>('/messages');
}

export async function fetchMediaSchemes(): Promise<MediaSchemeData> {
  return fetchJson<MediaSchemeData>('/media/schemes');
}

export async function fetchVoteOptions(): Promise<VoteOption[]> {
  return fetchJson<VoteOption[]>('/votes/options');
}

export async function fetchVoteResults(): Promise<{ options: VoteOption[]; voters: Voter[] }> {
  return fetchJson<{ options: VoteOption[]; voters: Voter[] }>('/votes/results');
}

export async function fetchGuests(): Promise<Voter[]> {
  return fetchJson<Voter[]>('/guests');
}

// --- Scheme CRUD ---

export async function createScheme(name: string): Promise<{ schemeId: string; schemes: MediaSchemeData }> {
  return postJson('/media/schemes', { name });
}

export async function renameSchemeApi(oldId: string, newName: string): Promise<MediaSchemeData> {
  return putJson(`/media/schemes/${encodeURIComponent(oldId)}/rename`, { newName });
}

export async function deleteSchemeApi(id: string): Promise<MediaSchemeData> {
  return deleteJsonReq(`/media/schemes/${encodeURIComponent(id)}`);
}

export async function setLiveSchemeApi(schemeId: string): Promise<{ ok: true }> {
  return putJson('/media/schemes/live', { schemeId });
}

// --- Media Item CRUD ---

export async function requestPresignedUrls(
  schemeId: string,
  files: { name: string; type: string; size: number }[]
): Promise<PresignedUploadResponse> {
  return postJson(`/media/schemes/${encodeURIComponent(schemeId)}/items/presign`, { files });
}

export async function uploadFileToR2(uploadUrl: string, file: File): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  });
  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
  }
}

export async function reorderMedia(schemeId: string, itemIds: string[]): Promise<MediaItem[]> {
  return putJson(`/media/schemes/${encodeURIComponent(schemeId)}/items/order`, { itemIds });
}

export async function toggleMediaVisibility(
  schemeId: string,
  itemId: string,
  visible: boolean
): Promise<MediaItem> {
  return patchJson(`/media/schemes/${encodeURIComponent(schemeId)}/items/${encodeURIComponent(itemId)}/visibility`, { visible });
}

export async function deleteMedia(schemeId: string, itemId: string): Promise<{ ok: true }> {
  return deleteJsonReq(`/media/schemes/${encodeURIComponent(schemeId)}/items/${encodeURIComponent(itemId)}`);
}

export async function pinMedia(schemeId: string, mediaId: string | null): Promise<{ ok: true }> {
  return putJson(`/media/schemes/${encodeURIComponent(schemeId)}/pin`, { mediaId });
}

// --- Display Settings ---

export async function updateDisplaySettings(settings: DisplaySettings): Promise<{ ok: true }> {
  return putJson('/display/settings', settings);
}