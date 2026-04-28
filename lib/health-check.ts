/**
 * Health Check Utilities
 * Verifica stato servizi esterni
 */

export async function checkDatabase(): Promise<boolean> {
  try {
    const { supabase } = await import('./supabase')
    const { error } = await supabase.from('lara_users').select('id').limit(1)
    if (error) throw error
    return true
  } catch (e) {
    console.log('Database health check failed:', e)
    return false
  }
}

export async function checkReplicate(): Promise<boolean> {
  try {
    const token = process.env.REPLICATE_API_TOKEN
    if (!token) return false

    const res = await fetch('https://api.replicate.com/v1/models', {
      headers: { 'Authorization': `Token ${token}` }
    })
    return res.ok
  } catch (e) {
    console.log('Replicate health check failed:', e)
    return false
  }
}

export async function checkTelegram(): Promise<boolean> {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN
    if (!token) return false

    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`)
    const data = await res.json()
    return data.ok
  } catch (e) {
    console.log('Telegram health check failed:', e)
    return false
  }
}

export async function checkOllama(): Promise<boolean> {
  try {
    const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
    const res = await fetch(`${ollamaBaseUrl}/api/tags`)
    return res.ok
  } catch (e) {
    console.log('Ollama health check failed:', e)
    return false
  }
}
