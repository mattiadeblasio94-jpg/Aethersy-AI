import { TasksDB, LogsDB } from '../../../lib/supabase'
import { runLaraAgent } from '../../../lib/lara-agent'

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito' })
  }

  // Verifica secret per cron job
  const authHeader = req.headers.authorization
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    // Carica task cron attivi
    const tasks = await TasksDB.getPending()

    if (!tasks.length) {
      return res.json({ message: 'Nessun task cron da eseguire', tasks: 0 })
    }

    const results = []

    for (const task of tasks) {
      try {
        // Segna task come in esecuzione
        await TasksDB.updateStatus(task.id, 'running')

        // Controlla schedule cron
        const config = task.trigger_config || {}
        const now = new Date()
        const lastRun = config.last_run ? new Date(config.last_run) : null
        const intervalMs = (config.interval_minutes || 60) * 60 * 1000

        // Salta se non è ancora il momento
        if (lastRun && now.getTime() - lastRun.getTime() < intervalMs) {
          await TasksDB.updateStatus(task.id, 'pending')
          continue
        }

        // Esegui azioni del task
        const actionResults = []
        for (const action of (task.actions || [])) {
          if (action.type === 'lara_prompt') {
            // Lara esegue un prompt autonomo
            const result = await runLaraAgent({
              userId: action.config.user_id || 'system',
              sessionId: `cron_${task.id}_${Date.now()}`,
              userMessage: action.config.prompt,
              chatId: action.config.chat_id
            })
            actionResults.push({
              action: action.type,
              response: result.response,
              steps: result.steps_executed
            })
          }

          if (action.type === 'http_request') {
            // Chiama API esterna
            const res = await fetch(action.config.url, {
              method: action.config.method || 'GET',
              headers: action.config.headers || {},
              body: action.config.body ? JSON.stringify(action.config.body) : undefined
            })
            actionResults.push({
              action: action.type,
              status: res.status,
              ok: res.ok
            })
          }

          if (action.type === 'telegram_message') {
            // Invia messaggio Telegram proattivo
            const token = process.env.TELEGRAM_BOT_TOKEN
            if (token) {
              await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: action.config.chat_id,
                  text: action.config.message,
                  parse_mode: 'HTML'
                })
              })
              actionResults.push({ action: action.type, status: 'sent' })
            }
          }
        }

        // Aggiorna last run e segna done
        await TasksDB.updateStatus(task.id, 'pending', {
          last_execution: actionResults
        })

        await LogsDB.write(
          task.user_id || 'system',
          'cron_execution',
          'ok',
          { task_id: task.id },
          { results: actionResults }
        )

        results.push({
          task_id: task.id,
          name: task.name,
          status: 'executed',
          actions: actionResults
        })

      } catch (taskError) {
        await TasksDB.updateStatus(task.id, 'failed', { error: taskError.message })
        await LogsDB.write(
          task.user_id || 'system',
          'cron_execution_error',
          'error',
          { task_id: task.id },
          { error: taskError.message }
        )
        results.push({
          task_id: task.id,
          name: task.name,
          status: 'failed',
          error: taskError.message
        })
      }
    }

    return res.json({
      message: `Eseguiti ${results.length} task cron`,
      results
    })

  } catch (error) {
    console.error('Lara Cron error:', error)
    return res.status(500).json({ error: error.message })
  }
}
