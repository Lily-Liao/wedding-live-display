
import { GuestMessage, MediaItem, SchemeId, VoteOption, BackendScheme, BackendMediaItem, ApiResponse, PresignedUploadResponse, EligibleParticipant, DrawWinner } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const HOST_BASE = API_BASE.replace(/\/api\/?$/, '');

// --- Generic helpers that unwrap { success, data } wrapper ---

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  const json: ApiResponse<T> = await response.json();
  if (!json.success) {
    throw new Error(json.message || 'API returned success=false');
  }
  return json.data;
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
  const json: ApiResponse<T> = await response.json();
  if (!json.success) {
    throw new Error(json.message || 'API returned success=false');
  }
  return json.data;
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
  const json: ApiResponse<T> = await response.json();
  if (!json.success) {
    throw new Error(json.message || 'API returned success=false');
  }
  return json.data;
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
  const json: ApiResponse<T> = await response.json();
  if (!json.success) {
    throw new Error(json.message || 'API returned success=false');
  }
  return json.data;
}

async function deleteJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  const json: ApiResponse<T> = await response.json();
  if (!json.success) {
    throw new Error(json.message || 'API returned success=false');
  }
  return json.data;
}

// --- Transform helpers ---

function mapBackendMediaItem(item: BackendMediaItem): MediaItem {
  return {
    id: item.id,
    url: item.readUrl,
    type: item.contentType.startsWith('video') ? 'video' : 'image',
    visible: item.isVisible,
  };
}

function mapBackendSchemes(backendSchemes: BackendScheme[]): {
  schemeIds: SchemeId[];
  schemes: Record<SchemeId, MediaItem[]>;
  schemeNames: Record<SchemeId, string>;
  liveSchemeId: SchemeId | null;
  pinnedSchemeIds: Record<SchemeId, boolean>;
} {
  const schemeIds: SchemeId[] = [];
  const schemes: Record<SchemeId, MediaItem[]> = {};
  const schemeNames: Record<SchemeId, string> = {};
  let liveSchemeId: SchemeId | null = null;
  const pinnedSchemeIds: Record<SchemeId, boolean> = {};

  const sorted = [...backendSchemes].sort((a, b) => a.sortOrder - b.sortOrder);
  for (const s of sorted) {
    schemeIds.push(s.id);
    const sortedItems = [...s.items].sort((a, b) => a.sortOrder - b.sortOrder);
    schemes[s.id] = sortedItems.map(mapBackendMediaItem);
    schemeNames[s.id] = s.name;
    if (s.isLive) liveSchemeId = s.id;
    pinnedSchemeIds[s.id] = s.isPinned;
  }

  return { schemeIds, schemes, schemeNames, liveSchemeId, pinnedSchemeIds };
}

// --- Read APIs ---

export async function fetchMessages(): Promise<GuestMessage[]> {
  return fetchJson<GuestMessage[]>('/messages');
}

export async function fetchMediaSchemes(): Promise<ReturnType<typeof mapBackendSchemes>> {
  const data = await fetchJson<BackendScheme[]>('/media/schemes');
  return mapBackendSchemes(data);
}

export async function fetchVoteOptions(): Promise<{ options: VoteOption[]; totalVotes: number }> {
  return fetchJson<{ options: VoteOption[]; totalVotes: number }>('/votes/options');
}

// --- Scheme CRUD ---

export async function createScheme(name: string): Promise<BackendScheme> {
  return postJson<BackendScheme>('/media/schemes', { name });
}

export async function renameSchemeApi(id: string, newName: string): Promise<BackendScheme> {
  return putJson<BackendScheme>(`/media/schemes/${encodeURIComponent(id)}/rename`, { name: newName });
}

export async function deleteSchemeApi(id: string): Promise<void> {
  await deleteJson<null>(`/media/schemes/${encodeURIComponent(id)}`);
}

export async function setLiveSchemeApi(schemeId: string): Promise<void> {
  await putJson<null>('/media/schemes/live', { schemeId });
}

// --- Media Item CRUD ---

export async function requestPresignedUrl(
  schemeId: string,
  file: { fileName: string; contentType: string; fileSize: number }
): Promise<PresignedUploadResponse> {
  return postJson<PresignedUploadResponse>(
    `/media/schemes/${encodeURIComponent(schemeId)}/items/presign`,
    file
  );
}

export async function uploadFileToR2(uploadUrl: string, file: File): Promise<void> {
  console.log('[R2 Upload] Starting PUT to:', uploadUrl);
  console.log('[R2 Upload] File:', file.name, 'Type:', file.type, 'Size:', file.size);

  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
  });

  console.log('[R2 Upload] Response status:', response.status);

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    console.error('[R2 Upload] Failed:', response.status, response.statusText, text);
    throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
  }

  console.log('[R2 Upload] Success:', file.name);
}

export async function reorderMedia(schemeId: string, itemIds: string[]): Promise<void> {
  await putJson<null>(`/media/schemes/${encodeURIComponent(schemeId)}/items/order`, { itemIds });
}

export async function toggleMediaVisibility(
  schemeId: string,
  itemId: string,
  visible: boolean
): Promise<void> {
  await patchJson<null>(
    `/media/schemes/${encodeURIComponent(schemeId)}/items/${encodeURIComponent(itemId)}/visibility`,
    { visible }
  );
}

export async function deleteMedia(schemeId: string, itemId: string): Promise<void> {
  await deleteJson<null>(
    `/media/schemes/${encodeURIComponent(schemeId)}/items/${encodeURIComponent(itemId)}`
  );
}

export async function pinMedia(schemeId: string): Promise<void> {
  await putJson<null>(`/media/schemes/${encodeURIComponent(schemeId)}/pin`, {});
}

// --- Voting Session ---

export type VotingSessionStatus = 'WAITING' | 'START' | 'CLOSED';

export async function updateVotingSessionStatus(status: VotingSessionStatus): Promise<void> {
  const response = await fetch(`${HOST_BASE}/admin/voting-session/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  const json: ApiResponse<unknown> = await response.json();
  if (!json.success) {
    throw new Error(json.message || 'API returned success=false');
  }
}

// --- Lucky Draw ---

export async function fetchEligibleParticipants(): Promise<{
  data: EligibleParticipant[];
  metadata: { totalCount: number; updatedAt: string };
}> {
  return fetchJson('/v1/participants/eligible');
}

export async function drawWinnerApi(): Promise<DrawWinner> {
  return postJson<DrawWinner>('/v1/winners', {});
}

export async function fetchWinnersApi(): Promise<DrawWinner[]> {
  return fetchJson<DrawWinner[]>('/v1/winners');
}

export async function cancelWinnerApi(id: string): Promise<void> {
  await deleteJson<null>(`/v1/winners/${encodeURIComponent(id)}`);
}

export async function resetAllWinnersApi(): Promise<void> {
  await deleteJson<null>('/v1/winners');
}
