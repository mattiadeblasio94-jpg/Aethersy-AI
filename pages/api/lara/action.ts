/**
 * Lara AI + OpenClaw Real Actions API
 * Esegue azioni reali basate sulle richieste dell'utente
 */

import { createOpenClawRealActions, ActionType, ActionConfig } from '../../../lib/openclaw-real-actions'
import { createCinemaStudio } from '../../../lib/cinema-studio-2026'

const openClaw = createOpenClawRealActions(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const cinema = createCinemaStudio(process.env.REPLICATE_API_TOKEN)

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { action, params, userId, chatId } = req.body

  try {
    console.log(`[Lara Action] Executing: ${action.type}`, params)

    // ============================================
    // CINEMA STUDIO ACTIONS
    // ============================================

    if (action.type === 'cinema_video') {
      const result = await cinema.executeRealAction({
        type: 'generate_video',
        params: {
          model: params.model || 'seedance',
          prompt: params.prompt,
          duration: params.duration || 10,
          resolution: params.resolution || '1080p',
          camera: params.camera,
          lighting: params.lighting,
        },
        webhookUrl: params.webhookUrl,
        notifyTelegram: params.notifyTelegram,
        telegramChatId: params.telegramChatId || process.env.ADMIN_TELEGRAM_ID,
      })

      return res.status(200).json({
        success: true,
        action: 'cinema_video',
        result,
        message: `Video generato con ${result.model} (${result.duration}s) - Costo: $${result.cost.toFixed(4)}`,
      })
    }

    if (action.type === 'cinema_image') {
      const result = await cinema.executeRealAction({
        type: 'generate_image',
        params: {
          model: params.model || 'flux',
          prompt: params.prompt,
          aspectRatio: params.aspectRatio || '16:9',
          quality: params.quality || 'hd',
          camera: params.camera,
        },
        webhookUrl: params.webhookUrl,
        notifyTelegram: params.notifyTelegram,
        telegramChatId: params.telegramChatId,
      })

      return res.status(200).json({
        success: true,
        action: 'cinema_image',
        result,
        message: `Immagine generata con ${result.model} - Costo: $${result.cost.toFixed(4)}`,
      })
    }

    if (action.type === 'cinema_music') {
      const result = await cinema.executeRealAction({
        type: 'generate_music',
        params: {
          model: params.model || 'musicGen',
          prompt: params.prompt,
          genre: params.genre || 'electronic',
          bpm: params.bpm || 120,
          key: params.key || 'C major',
          duration: params.duration || 60,
          stems: params.stems || false,
        },
        webhookUrl: params.webhookUrl,
        notifyTelegram: params.notifyTelegram,
        telegramChatId: params.telegramChatId,
      })

      return res.status(200).json({
        success: true,
        action: 'cinema_music',
        result,
        message: `Musica generata con ${result.model} (${result.bpm} BPM, ${result.key}) - Costo: $${result.cost.toFixed(4)}`,
      })
    }

    if (action.type === 'cinema_voice') {
      const result = await cinema.executeRealAction({
        type: 'generate_voice',
        params: {
          model: params.model || 'elevenLabs',
          text: params.text,
          voice: params.voice,
          emotion: params.emotion || 'neutral',
          speed: params.speed || 1.0,
        },
        webhookUrl: params.webhookUrl,
        notifyTelegram: params.notifyTelegram,
        telegramChatId: params.telegramChatId,
      })

      return res.status(200).json({
        success: true,
        action: 'cinema_voice',
        result,
        message: `Voce generata con ${result.model} - Costo: $${result.cost.toFixed(4)}`,
      })
    }

    // ============================================
    // OPENCLAW REAL ACTIONS
    // ============================================

    if (action.type === 'api_call') {
      const result = await openClaw.execute({
        type: 'api_call',
        name: params.name || 'API Call',
        description: params.description || 'Chiamata API esterna',
        config: {
          url: params.url,
          method: params.method,
          headers: params.headers,
          body: params.body,
          queryParams: params.queryParams,
        } as ActionConfig,
        maxRetries: 3,
      })

      return res.status(200).json({
        success: true,
        action: 'api_call',
        result: result.result,
        message: `API call completata: ${params.url}`,
      })
    }

    if (action.type === 'email_send') {
      const result = await openClaw.execute({
        type: 'email_send',
        name: params.subject || 'Email',
        description: 'Invio email automatica',
        config: {
          emailProvider: 'sendgrid',
          emailTo: params.to,
          emailSubject: params.subject,
          emailBody: params.html || params.text,
        } as ActionConfig,
        maxRetries: 2,
      })

      return res.status(200).json({
        success: true,
        action: 'email_send',
        result: result.result,
        message: `Email inviata a ${params.to}`,
      })
    }

    if (action.type === 'telegram_send') {
      const result = await openClaw.execute({
        type: 'telegram_send',
        name: 'Telegram Message',
        description: 'Invio messaggio Telegram',
        config: {
          telegramChatId: params.chatId,
          telegramMessage: params.message,
        } as ActionConfig,
        maxRetries: 3,
      })

      return res.status(200).json({
        success: true,
        action: 'telegram_send',
        result: result.result,
        message: `Messaggio inviato su Telegram`,
      })
    }

    if (action.type === 'database_insert') {
      const result = await openClaw.execute({
        type: 'database_insert',
        name: params.table || 'Database Insert',
        description: 'Inserimento dati nel database',
        config: {
          table: params.table,
          data: params.data,
        } as ActionConfig,
        maxRetries: 3,
      })

      return res.status(200).json({
        success: true,
        action: 'database_insert',
        result: result.result,
        message: `Dati inseriti in ${params.table}`,
      })
    }

    if (action.type === 'stripe_charge') {
      const result = await openClaw.execute({
        type: 'stripe_charge',
        name: 'Stripe Payment',
        description: 'Addebito pagamento Stripe',
        config: {
          stripeAmount: params.amount,
          stripeCurrency: params.currency || 'eur',
          stripeCustomerId: params.customerId,
        } as ActionConfig,
        maxRetries: 2,
      })

      return res.status(200).json({
        success: true,
        action: 'stripe_charge',
        result: result.result,
        message: `Pagamento Stripe: €${(params.amount / 100).toFixed(2)}`,
      })
    }

    if (action.type === 'webhook_trigger') {
      const result = await openClaw.execute({
        type: 'webhook',
        name: params.name || 'Webhook',
        description: 'Trigger webhook esterno',
        config: {
          url: params.url,
          body: params.body,
          headers: params.headers,
        } as ActionConfig,
        maxRetries: 3,
      })

      return res.status(200).json({
        success: true,
        action: 'webhook_trigger',
        result: result.result,
        message: `Webhook inviato: ${params.url}`,
      })
    }

    if (action.type === 'workflow') {
      const result = await openClaw.execute({
        type: 'workflow_trigger',
        name: params.name || 'Workflow',
        description: 'Esecuzione workflow complesso',
        config: {
          workflowId: params.workflowId,
          workflowSteps: params.steps,
        } as ActionConfig,
        maxRetries: 1,
      })

      return res.status(200).json({
        success: true,
        action: 'workflow',
        result: result.result,
        message: `Workflow eseguito: ${result.result.results?.length || 0} step completati`,
      })
    }

    // ============================================
    // UNKNOWN ACTION
    // ============================================

    return res.status(400).json({
      success: false,
      error: 'Azione non supportata',
      supportedActions: [
        'cinema_video', 'cinema_image', 'cinema_music', 'cinema_voice',
        'api_call', 'email_send', 'telegram_send', 'database_insert',
        'stripe_charge', 'webhook_trigger', 'workflow',
      ],
    })

  } catch (error: any) {
    console.error('[Lara Action] Error:', error)

    return res.status(500).json({
      success: false,
      error: error.message || 'Errore esecuzione azione',
      action,
    })
  }
}
