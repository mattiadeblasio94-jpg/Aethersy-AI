import { createClient } from '@supabase/supabase-js'

// ============================================
// TIPI DATABASE
// ============================================
export type Platform = 'web' | 'telegram' | 'api'
export type TaskStatus = 'pending' | 'running' | 'done' | 'failed' | 'paused'
export type TriggerType = 'manual' | 'cron' | 'webhook' | 'event'
export type UserPlan = 'free' | 'pro' | 'enterprise'
export type MessageRole = 'user' | 'assistant' | 'system' | 'tool'
export type LogStatus = 'ok' | 'error' | 'warning'
export type MemoryCategory = 'general' | 'preference' | 'fact' | 'goal'

export interface LaraSession {
  id: string
  session_id: string
  user_id: string
  platform: Platform
  created_at: string
  updated_at: string
  metadata: Record<string, unknown>
}

export interface LaraMessage {
  id: string
  session_id: string
  user_id: string
  role: MessageRole
  content: string
  tool_calls?: Record<string, unknown>
  tool_results?: Record<string, unknown>
  tokens_used: number
  model: string
  created_at: string
}

export interface LaraTask {
  id: string
  name: string
  description: string
  user_id: string
  status: TaskStatus
  trigger_type: TriggerType
  trigger_config: Record<string, unknown>
  actions: Record<string, unknown>[]
  result?: Record<string, unknown>
  error?: string
  priority: number
  max_retries: number
  retry_count: number
  created_at: string
  updated_at: string
  executed_at?: string
}

export interface LaraLog {
  id: string
  task_id?: string
  session_id?: string
  user_id: string
  action: string
  input?: Record<string, unknown>
  output?: Record<string, unknown>
  status: LogStatus
  duration_ms: number
  created_at: string
}

export interface LaraMemory {
  id: string
  user_id: string
  key: string
  value: string
  category: MemoryCategory
  confidence: number
  source: string
  created_at: string
  updated_at: string
  expires_at?: string
}

export interface LaraUser {
  id: string
  user_id: string
  name?: string
  email?: string
  platform: Platform
  telegram_chat_id?: string
  plan: UserPlan
  tokens_used: number
  tokens_limit: number
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
  last_seen: string
}

export interface LaraKnowledge {
  id: string
  user_id: string
  title: string
  content: string
  category: string
  tags: string[]
  source_url?: string
  created_at: string
  updated_at: string
}

// ============================================
// SUPABASE CLIENT SINGLETON
// ============================================
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ SUPABASE_URL o SERVICE_KEY mancanti - alcune funzionalità Lara saranno disabilitate')
}

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'x-application-name': 'lara-agent'
        }
      }
    })
  : null

// ============================================
// HELPER: SESSIONI
// ============================================
export const SessionsDB = {
  async create(sessionId: string, userId: string, platform: Platform = 'web', metadata = {}) {
    if (!supabase) throw new Error('Supabase non configurato')
    const { data, error } = await supabase
      .from('lara_sessions')
      .insert({ session_id: sessionId, user_id: userId, platform, metadata })
      .select()
      .single()
    if (error) throw new Error(`SessionsDB.create: ${error.message}`)
    return data
  },

  async get(sessionId: string) {
    if (!supabase) return null
    const { data, error } = await supabase
      .from('lara_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single()
    if (error) return null
    return data
  },

  async getOrCreate(sessionId: string, userId: string, platform: Platform = 'web') {
    const existing = await this.get(sessionId)
    if (existing) return existing
    return await this.create(sessionId, userId, platform)
  },

  async delete(sessionId: string) {
    if (!supabase) return
    const { error } = await supabase
      .from('lara_sessions')
      .delete()
      .eq('session_id', sessionId)
    if (error) throw new Error(`SessionsDB.delete: ${error.message}`)
  },

  async listByUser(userId: string, limit = 20) {
    if (!supabase) return []
    const { data, error } = await supabase
      .from('lara_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit)
    if (error) throw new Error(`SessionsDB.listByUser: ${error.message}`)
    return data ?? []
  }
}

// ============================================
// HELPER: MESSAGGI
// ============================================
export const MessagesDB = {
  async save(
    sessionId: string,
    userId: string,
    role: MessageRole,
    content: string,
    tokensUsed = 0,
    model = 'gpt-4o',
    toolCalls?: Record<string, unknown>,
    toolResults?: Record<string, unknown>
  ) {
    if (!supabase) return null
    const { data, error } = await supabase
      .from('lara_messages')
      .insert({
        session_id: sessionId,
        user_id: userId,
        role,
        content,
        tokens_used: tokensUsed,
        model,
        tool_calls: toolCalls,
        tool_results: toolResults
      })
      .select()
      .single()
    if (error) throw new Error(`MessagesDB.save: ${error.message}`)
    return data
  },

  async getHistory(sessionId: string, limit = 20) {
    if (!supabase) return []
    const { data, error } = await supabase
      .from('lara_messages')
      .select('role, content, created_at, tool_calls, tool_results')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(limit)
    if (error) throw new Error(`MessagesDB.getHistory: ${error.message}`)
    return data ?? []
  },

  async countBySession(sessionId: string) {
    if (!supabase) return 0
    const { count, error } = await supabase
      .from('lara_messages')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId)
    if (error) throw new Error(`MessagesDB.countBySession: ${error.message}`)
    return count ?? 0
  }
}

// ============================================
// HELPER: MEMORIA
// ============================================
export const MemoryDB = {
  async set(
    userId: string,
    key: string,
    value: string,
    category: MemoryCategory = 'general',
    confidence = 1.0,
    source = 'conversation'
  ) {
    if (!supabase) return null
    const { data, error } = await supabase
      .from('lara_memory')
      .upsert({
        user_id: userId,
        key,
        value,
        category,
        confidence,
        source,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,key' })
      .select()
      .single()
    if (error) throw new Error(`MemoryDB.set: ${error.message}`)
    return data
  },

  async get(userId: string, key: string) {
    if (!supabase) return null
    const { data, error } = await supabase
      .from('lara_memory')
      .select('key, value, category, confidence, updated_at')
      .eq('user_id', userId)
      .eq('key', key)
      .single()
    if (error) return null
    return data
  },

  async getAll(userId: string, category?: MemoryCategory) {
    if (!supabase) return []
    let query = supabase
      .from('lara_memory')
      .select('key, value, category, confidence, updated_at')
      .eq('user_id', userId)

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query.order('updated_at', { ascending: false })
    if (error) throw new Error(`MemoryDB.getAll: ${error.message}`)
    return data ?? []
  },

  async delete(userId: string, key: string) {
    if (!supabase) return
    const { error } = await supabase
      .from('lara_memory')
      .delete()
      .eq('user_id', userId)
      .eq('key', key)
    if (error) throw new Error(`MemoryDB.delete: ${error.message}`)
  },

  async toContext(userId: string): Promise<string> {
    const memories = await this.getAll(userId)
    if (!memories.length) return ''
    const lines = memories.map(m => `- [${m.category}] ${m.key}: ${m.value}`)
    return `📦 Memoria utente:\n${lines.join('\n')}`
  }
}

// ============================================
// HELPER: UTENTI
// ============================================
export const UsersDB = {
  async getOrCreate(
    userId: string,
    name?: string,
    email?: string,
    platform: Platform = 'web',
    telegramChatId?: string
  ) {
    if (!supabase) return null
    const { data: existing } = await supabase
      .from('lara_users')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (existing) {
      await supabase
        .from('lara_users')
        .update({ last_seen: new Date().toISOString() })
        .eq('user_id', userId)
      return existing
    }

    const { data, error } = await supabase
      .from('lara_users')
      .insert({
        user_id: userId,
        name: name ?? 'Utente',
        email: email ?? null,
        platform,
        telegram_chat_id: telegramChatId ?? null,
        plan: 'free',
        tokens_used: 0,
        tokens_limit: 100000,
        settings: {}
      })
      .select()
      .single()

    if (error) throw new Error(`UsersDB.getOrCreate: ${error.message}`)
    return data
  },

  async get(userId: string) {
    if (!supabase) return null
    const { data, error } = await supabase
      .from('lara_users')
      .select('*')
      .eq('user_id', userId)
      .single()
    if (error) return null
    return data
  },

  async update(userId: string, updates: Partial<LaraUser>) {
    if (!supabase) return null
    const { data, error } = await supabase
      .from('lara_users')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single()
    if (error) throw new Error(`UsersDB.update: ${error.message}`)
    return data
  },

  async incrementTokens(userId: string, tokens: number) {
    if (!supabase) return
    const user = await this.get(userId)
    if (!user) return

    const { error } = await supabase
      .from('lara_users')
      .update({
        tokens_used: user.tokens_used + tokens,
        last_seen: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (error) throw new Error(`UsersDB.incrementTokens: ${error.message}`)
  },

  async hasTokensAvailable(userId: string): Promise<boolean> {
    const user = await this.get(userId)
    if (!user) return false
    return user.tokens_used < user.tokens_limit
  }
}

// ============================================
// HELPER: TASKS
// ============================================
export const TasksDB = {
  async create(task: Omit<LaraTask, 'id' | 'created_at' | 'updated_at'>) {
    if (!supabase) return null
    const { data, error } = await supabase
      .from('lara_tasks')
      .insert(task)
      .select()
      .single()
    if (error) throw new Error(`TasksDB.create: ${error.message}`)
    return data
  },

  async get(taskId: string) {
    if (!supabase) return null
    const { data, error } = await supabase
      .from('lara_tasks')
      .select('*')
      .eq('id', taskId)
      .single()
    if (error) return null
    return data
  },

  async listByUser(userId: string, status?: TaskStatus) {
    if (!supabase) return []
    let query = supabase
      .from('lara_tasks')
      .select('*')
      .eq('user_id', userId)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query
    if (error) throw new Error(`TasksDB.listByUser: ${error.message}`)
    return data ?? []
  },

  async updateStatus(
    taskId: string,
    status: TaskStatus,
    result?: Record<string, unknown>,
    errorMsg?: string
  ) {
    if (!supabase) return null
    const updates: Partial<LaraTask> = {
      status,
      ...(result && { result }),
      ...(errorMsg && { error: errorMsg }),
      ...(status === 'running' && { executed_at: new Date().toISOString() })
    }

    const { data, error } = await supabase
      .from('lara_tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single()
    if (error) throw new Error(`TasksDB.updateStatus: ${error.message}`)
    return data
  },

  async getPending() {
    if (!supabase) return []
    const { data, error } = await supabase
      .from('lara_tasks')
      .select('*')
      .eq('status', 'pending')
      .order('priority', { ascending: false })
    if (error) throw new Error(`TasksDB.getPending: ${error.message}`)
    return data ?? []
  },

  async pause(taskId: string) {
    return await this.updateStatus(taskId, 'paused')
  },

  async resume(taskId: string) {
    return await this.updateStatus(taskId, 'pending')
  }
}

// ============================================
// HELPER: LOGS
// ============================================
export const LogsDB = {
  async write(
    userId: string,
    action: string,
    status: LogStatus = 'ok',
    input?: Record<string, unknown>,
    output?: Record<string, unknown>,
    durationMs = 0,
    taskId?: string,
    sessionId?: string
  ) {
    if (!supabase) return null
    const { data, error } = await supabase
      .from('lara_logs')
      .insert({
        user_id: userId,
        action,
        status,
        input,
        output,
        duration_ms: durationMs,
        task_id: taskId ?? null,
        session_id: sessionId ?? null
      })
      .select()
      .single()
    if (error) console.error(`LogsDB.write error: ${error.message}`)
    return data
  },

  async getByUser(userId: string, limit = 50) {
    if (!supabase) return []
    const { data, error } = await supabase
      .from('lara_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw new Error(`LogsDB.getByUser: ${error.message}`)
    return data ?? []
  }
}
