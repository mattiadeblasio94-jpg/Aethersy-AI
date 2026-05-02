/**
 * Obsidian Tool - Lettura/Scrittura note Markdown
 * Gestisce il vault Second Brain degli utenti
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

export interface Note {
  id: string;
  title: string;
  content: string;
  folder: string;
  tags: string[];
  links: string[];
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SearchOptions {
  query: string;
  userId: string;
  folder?: string;
  tags?: string[];
  limit?: number;
}

export interface CreateNoteOptions {
  title: string;
  content: string;
  userId: string;
  folder?: string;
  tags?: string[];
  links?: string[];
}

/**
 * Cerca note nel vault
 */
export async function searchNotes(options: SearchOptions): Promise<Note[]> {
  const { query, userId, folder, tags, limit = 10 } = options;

  let queryBuilder = supabase
    .from('notes')
    .select('id, title, content, folder, tags, links, word_count, created_at, updated_at')
    .eq('user_id', userId)
    .ilike('content', `%${query}%`)
    .limit(limit);

  if (folder) {
    queryBuilder = queryBuilder.eq('folder', folder);
  }

  if (tags && tags.length > 0) {
    queryBuilder = queryBuilder.contains('tags', tags);
  }

  const { data, error } = await queryBuilder;

  if (error) throw error;

  return (data || []).map(d => ({
    id: d.id,
    title: d.title,
    content: d.content,
    folder: d.folder,
    tags: d.tags || [],
    links: d.links || [],
    wordCount: d.word_count || 0,
    createdAt: d.created_at,
    updatedAt: d.updated_at
  }));
}

/**
 * Crea una nuova nota
 */
export async function createNote(options: CreateNoteOptions): Promise<Note> {
  const { title, content, userId, folder = 'root', tags = [], links = [] } = options;

  // Estrai primo paragrafo per preview
  const preview = content.split('\n\n')[0]?.slice(0, 200);

  const newNote = {
    user_id: userId,
    title,
    content,
    folder,
    tags,
    links,
    content_preview: preview,
    word_count: content.split(/\s+/).length,
    file_size: Buffer.byteLength(content, 'utf8')
  };

  const { data, error } = await supabase
    .from('notes')
    .insert(newNote)
    .select()
    .single();

  if (error) throw error;

  // Aggiorna storage utente
  await updateUserStorage(userId, newNote.file_size);

  return {
    id: data.id,
    title: data.title,
    content: data.content,
    folder: data.folder,
    tags: data.tags || [],
    links: data.links || [],
    wordCount: data.word_count || 0,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

/**
 * Legge una nota per ID
 */
export async function readNote(noteId: string, userId: string): Promise<Note | null> {
  const { data } = await supabase
    .from('notes')
    .select('id, title, content, folder, tags, links, word_count, created_at, updated_at')
    .eq('id', noteId)
    .eq('user_id', userId)
    .single();

  if (!data) return null;

  return {
    id: data.id,
    title: data.title,
    content: data.content,
    folder: data.folder,
    tags: data.tags || [],
    links: data.links || [],
    wordCount: data.word_count || 0,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

/**
 * Aggiorna una nota esistente
 */
export async function updateNote(
  noteId: string,
  updates: Partial<CreateNoteOptions>,
  userId: string
): Promise<Note | null> {
  const { data: existing } = await supabase
    .from('notes')
    .select('id, file_size')
    .eq('id', noteId)
    .eq('user_id', userId)
    .single();

  if (!existing) return null;

  const updateData: any = {};
  if (updates.title) updateData.title = updates.title;
  if (updates.content) {
    updateData.content = updates.content;
    updateData.content_preview = updates.content.split('\n\n')[0]?.slice(0, 200);
    updateData.word_count = updates.content.split(/\s+/).length;
  }
  if (updates.folder) updateData.folder = updates.folder;
  if (updates.tags) updateData.tags = updates.tags;
  if (updates.links) updateData.links = updates.links;
  updateData.updated_at = new Date().toISOString();

  const { data } = await supabase
    .from('notes')
    .update(updateData)
    .eq('id', noteId)
    .eq('user_id', userId)
    .select()
    .single();

  if (!data) return null;

  return {
    id: data.id,
    title: data.title,
    content: data.content,
    folder: data.folder,
    tags: data.tags || [],
    links: data.links || [],
    wordCount: data.word_count || 0,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

/**
 * Elimina una nota
 */
export async function deleteNote(noteId: string, userId: string): Promise<boolean> {
  const { data: note } = await supabase
    .from('notes')
    .select('file_size')
    .eq('id', noteId)
    .eq('user_id', userId)
    .single();

  if (!note) return false;

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId)
    .eq('user_id', userId);

  if (error) return false;

  // Riduci storage utente
  await updateUserStorage(userId, -note.file_size);

  return true;
}

/**
 * Ottieni tutte le cartelle di un utente
 */
export async function getFolders(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('notes')
    .select('folder')
    .eq('user_id', userId);

  const folders = new Set<string>();
  folders.add('root');
  data?.forEach(d => d.folder && folders.add(d.folder));
  return Array.from(folders);
}

/**
 * Ottieni tutti i tag di un utente
 */
export async function getTags(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('notes')
    .select('tags')
    .eq('user_id', userId);

  const tags = new Set<string>();
  data?.forEach(d => d.tags?.forEach(t => tags.add(t)));
  return Array.from(tags);
}

/**
 * Aggiorna storage utente
 */
async function updateUserStorage(userId: string, deltaBytes: number): Promise<void> {
  try {
    await supabase.rpc('increment_storage', {
      user_id_filter: userId,
      delta: deltaBytes
    });
  } catch {
    // Fallback se la funzione RPC non esiste
    try {
      const { data: current } = await supabase.from('lara_users').select('storage_used').eq('user_id', userId).single();
      if (current) {
        await supabase.from('lara_users').update({ storage_used: (current.storage_used || 0) + deltaBytes }).eq('user_id', userId);
      }
    } catch {
      // Ignora se tabella non esiste
    }
  }
}

/**
 * Ricerca semantica con embedding (richiede pgvector)
 */
export async function semanticSearch(
  query: string,
  userId: string,
  embedding: number[],
  limit = 5
): Promise<Note[]> {
  const { data, error } = await supabase.rpc('match_memories', {
    query_embedding: embedding,
    filter_user_id: userId,
    match_limit: limit
  });

  if (error) throw error;

  return (data || []).map(d => ({
    id: d.id,
    title: d.title,
    content: d.value,
    folder: 'memory',
    tags: [],
    links: [],
    wordCount: d.value?.split(/\s+/).length || 0,
    createdAt: d.created_at,
    updatedAt: d.updated_at
  }));
}
