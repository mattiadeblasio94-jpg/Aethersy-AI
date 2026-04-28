/**
 * Admin API - Monitoraggio Lead & Activity System
 * Accesso illimitato per utente principale (ID: 8074643162)
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const ADMIN_ID = '8074643162'

export default async function handler(req, res) {
  const supabase = createClient(supabaseUrl, supabaseKey)
  const { endpoint, userId, email, startDate, endDate } = req.query
  const method = req.method

  // Verifica accesso admin (semplificato per Telegram user ID)
  const authHeader = req.headers.authorization
  const token = authHeader?.replace('Bearer ', '')

  // Permetti accesso se token è "admin-token" o admin ID
  const isAdmin = token === 'admin-token' || token === ADMIN_ID

  if (!isAdmin) {
    return res.status(403).json({ error: 'Admin access required' })
  }

  try {
    switch (endpoint) {
      case 'stats':
        const { count: newUsersToday } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', new Date().setHours(0, 0, 0, 0))

        const { count: newLeadsToday } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', new Date().setHours(0, 0, 0, 0))

        const { data: activeSessions } = await supabase
          .from('active_sessions')
          .select('id')
          .gte('last_seen_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())

        const { data: usageToday } = await supabase
          .from('token_usage')
          .select('tokens_total, cost_usd')
          .gte('created_at', new Date().setHours(0, 0, 0, 0))

        const totalTokensToday = usageToday?.reduce((sum, r) => sum + (r.tokens_total || 0), 0) || 0
        const totalCostToday = usageToday?.reduce((sum, r) => sum + parseFloat(r.cost_usd || 0), 0) || 0

        const { data: allUsers } = await supabase.from('users').select('plan')
        const mrr = allUsers?.reduce((sum, u) => {
          if (u.plan === 'pro') return sum + 49
          if (u.plan === 'business') return sum + 199
          return sum
        }, 0) || 0

        return res.status(200).json({
          success: true,
          stats: {
            newUsersToday: newUsersToday || 0,
            newLeadsToday: newLeadsToday || 0,
            activeSessions: activeSessions?.length || 0,
            tokensUsedToday: totalTokensToday,
            costToday: totalCostToday.toFixed(4),
            mrr: mrr || 0,
            totalUsers: allUsers?.length || 0,
          },
        })

      case 'leads':
        let leadsQuery = supabase.from('leads').select('*, users(email, full_name, plan)')
        if (startDate) leadsQuery = leadsQuery.gte('created_at', startDate)
        if (endDate) leadsQuery = leadsQuery.lte('created_at', endDate)
        const { data: leads } = await leadsQuery.order('created_at', { ascending: false })
        return res.status(200).json({ success: true, data: leads || [] })

      case 'billing':
        const { data: billing } = await supabase
          .from('users')
          .select('id, email, full_name, plan, stripe_subscription_id, stripe_customer_id, created_at')
          .order('created_at', { ascending: false })

        const mrrBilling = billing?.reduce((sum, u) => {
          if (u.plan === 'pro') return sum + 49
          if (u.plan === 'business') return sum + 199
          return sum
        }, 0) || 0

        return res.status(200).json({
          success: true,
          data: billing || [],
          metrics: {
            mrr: mrrBilling,
            proUsers: billing?.filter(u => u.plan === 'pro').length || 0,
            businessUsers: billing?.filter(u => u.plan === 'business').length || 0,
          },
        })

      case 'user':
        let userQuery
        if (userId) {
          userQuery = supabase.from('users').select('*').eq('id', userId).single()
        } else if (email) {
          userQuery = supabase.from('users').select('*').eq('email', email).single()
        } else {
          return res.status(400).json({ error: 'userId or email required' })
        }

        const { data: userData } = await userQuery
        if (!userData) return res.status(404).json({ error: 'User not found' })

        const { data: activity } = await supabase
          .from('activity_logs')
          .select('*')
          .eq('user_id', userData.id)
          .order('created_at', { ascending: false })
          .limit(50)

        const { data: usage } = await supabase
          .from('token_usage')
          .select('*')
          .eq('user_id', userData.id)
          .order('created_at', { ascending: false })
          .limit(50)

        return res.status(200).json({
          success: true,
          data: { user: userData, activity, usage },
        })

      case 'grant-admin':
        if (method === 'POST') {
          const { targetUserEmail, permissions } = req.body

          const { data: targetUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', targetUserEmail)
            .single()

          if (!targetUser) {
            return res.status(404).json({ error: 'User not found' })
          }

          await supabase.from('admin_users').upsert({
            user_id: targetUser.id,
            permissions: permissions || { dashboard: true, users: true, billing: true, logs: true },
            granted_by: userData?.id || 'system',
          })

          return res.status(200).json({ success: true, message: 'Admin granted' })
        }
        break

      default:
        return res.status(400).json({ error: 'Invalid endpoint' })
    }
  } catch (error) {
    console.error('Admin API error:', error)
    return res.status(500).json({ error: error.message })
  }
}
