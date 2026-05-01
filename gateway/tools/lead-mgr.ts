/**
 * Lead Manager Tool - CRM e gestione lead
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

export interface Lead {
  id: string;
  userId: string;
  email: string;
  name: string;
  company?: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  valuePotential?: number;
  source?: string;
  lastContactAt?: string;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeadOptions {
  email: string;
  name?: string;
  company?: string;
  status?: Lead['status'];
  valuePotential?: number;
  source?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface LeadFilters {
  status?: Lead['status'];
  source?: string;
  company?: string;
  min_value?: number;
  max_value?: number;
  createdAfter?: string;
  createdBefore?: string;
}

/**
 * Crea nuovo lead
 */
export async function createLead(userId: string, options: CreateLeadOptions): Promise<Lead> {
  const leadData = {
    user_id: userId,
    email: options.email,
    name: options.name || options.email.split('@')[0],
    company: options.company,
    status: options.status || 'new',
    value_potential: options.value_potential,
    source: options.source || 'manual',
    notes: options.notes,
    metadata: options.metadata,
    last_contact_at: options.status === 'contacted' ? new Date().toISOString() : null
  };

  const { data, error } = await supabase
    .from('leads')
    .insert(leadData)
    .select()
    .single();

  if (error) throw error;

  return mapLead(data);
}

/**
 * Ottieni lead con filtri
 */
export async function getLeads(userId: string, filters: LeadFilters = {}, limit = 50): Promise<Lead[]> {
  let query = supabase
    .from('leads')
    .select('*')
    .eq('user_id', userId)
    .limit(limit);

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.source) {
    query = query.eq('source', filters.source);
  }

  if (filters.company) {
    query = query.ilike('company', `%${filters.company}%`);
  }

  if (filters.min_value !== undefined) {
    query = query.gte('value_potential', filters.min_value);
  }

  if (filters.max_value !== undefined) {
    query = query.lte('value_potential', filters.max_value);
  }

  if (filters.createdAfter) {
    query = query.gte('created_at', filters.createdAfter);
  }

  if (filters.createdBefore) {
    query = query.lte('created_at', filters.createdBefore);
  }

  // Ordina per data (nuovi prima)
  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) throw error;

  return data.map(mapLead);
}

/**
 * Ottieni singolo lead
 */
export async function getLead(leadId: string, userId: string): Promise<Lead | null> {
  const { data } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .eq('user_id', userId)
    .single();

  if (!data) return null;

  return mapLead(data);
}

/**
 * Aggiorna lead
 */
export async function updateLead(
  leadId: string,
  updates: Partial<CreateLeadOptions> & { status?: Lead['status'] },
  userId: string
): Promise<Lead | null> {
  const { data: existing } = await supabase
    .from('leads')
    .select('id, status')
    .eq('id', leadId)
    .eq('user_id', userId)
    .single();

  if (!existing) return null;

  const updateData: any = { updated_at: new Date().toISOString() };

  if (updates.name) updateData.name = updates.name;
  if (updates.company) updateData.company = updates.company;
  if (updates.status) {
    updateData.status = updates.status;
    if (updates.status === 'contacted' && existing.status !== 'contacted') {
      updateData.last_contact_at = new Date().toISOString();
    }
  }
  if (updates.valuePotential !== undefined) updateData.value_potential = updates.valuePotential;
  if (updates.notes) updateData.notes = updates.notes;
  if (updates.metadata) updateData.metadata = updates.metadata;

  const { data } = await supabase
    .from('leads')
    .update(updateData)
    .eq('id', leadId)
    .eq('user_id', userId)
    .select()
    .single();

  if (!data) return null;

  return mapLead(data);
}

/**
 * Elimina lead
 */
export async function deleteLead(leadId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', leadId)
    .eq('user_id', userId);

  return !error;
}

/**
 * Aggiorna stato lead
 */
export async function updateLeadStatus(
  leadId: string,
  newStatus: Lead['status'],
  userId: string,
  notes?: string
): Promise<Lead | null> {
  const updates: any = {
    status: newStatus,
    updated_at: new Date().toISOString()
  };

  if (newStatus === 'contacted') {
    updates.last_contact_at = new Date().toISOString();
  }

  if (notes) {
    updates.notes = notes;
  }

  const { data } = await supabase
    .from('leads')
    .update(updates)
    .eq('id', leadId)
    .eq('user_id', userId)
    .select()
    .single();

  if (!data) return null;

  return mapLead(data);
}

/**
 * Aggiungi nota a lead
 */
export async function addLeadNote(
  leadId: string,
  note: string,
  userId: string
): Promise<Lead | null> {
  const { data: lead } = await supabase
    .from('leads')
    .select('notes')
    .eq('id', leadId)
    .eq('user_id', userId)
    .single();

  if (!lead) return null;

  const existingNotes = lead.notes || '';
  const timestamp = new Date().toLocaleString('it-IT');
  const newNotes = existingNotes
    ? `${existingNotes}\n\n---\n[${timestamp}] ${note}`
    : `[${timestamp}] ${note}`;

  const { data } = await supabase
    .from('leads')
    .update({ notes: newNotes, updated_at: new Date().toISOString() })
    .eq('id', leadId)
    .eq('user_id', userId)
    .select()
    .single();

  if (!data) return null;

  return mapLead(data);
}

/**
 * Ottieni statistiche lead
 */
export async function getLeadStats(userId: string): Promise<{
  total: number;
  byStatus: Record<string, number>;
  totalValue: number;
  conversionRate: number;
}> {
  const { data: leads } = await supabase
    .from('leads')
    .select('status, value_potential')
    .eq('user_id', userId);

  const stats = {
    total: leads?.length || 0,
    byStatus: {} as Record<string, number>,
    totalValue: 0,
    conversionRate: 0
  };

  leads?.forEach(lead => {
    stats.byStatus[lead.status] = (stats.byStatus[lead.status] || 0) + 1;
    if (lead.value_potential) {
      stats.totalValue += lead.value_potential;
    }
  });

  if (stats.total > 0) {
    stats.conversionRate = (stats.byStatus['converted'] || 0) / stats.total;
  }

  return stats;
}

/**
 * Importa lead da CSV
 */
export async function importLeads(
  userId: string,
  leads: Array<{ email: string; name?: string; company?: string }>
): Promise<{ success: number; failed: number; errors: string[] }> {
  const results = { success: 0, failed: 0, errors: [] as string[] };

  for (const leadData of leads) {
    try {
      await createLead(userId, {
        email: leadData.email,
        name: leadData.name,
        company: leadData.company,
        source: 'import'
      });
      results.success++;
    } catch (error: any) {
      results.failed++;
      results.errors.push(`${leadData.email}: ${error.message}`);
    }
  }

  return results;
}

/**
 * Mappa dati DB a interfaccia Lead
 */
function mapLead(data: any): Lead {
  return {
    id: data.id,
    userId: data.user_id,
    email: data.email,
    name: data.name,
    company: data.company,
    status: data.status,
    valuePotential: data.value_potential,
    source: data.source,
    lastContactAt: data.last_contact_at,
    notes: data.notes,
    metadata: data.metadata,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

/**
 * Cerca lead per email
 */
export async function searchLeadByEmail(email: string, userId: string): Promise<Lead | null> {
  const { data } = await supabase
    .from('leads')
    .select('*')
    .eq('user_id', userId)
    .eq('email', email)
    .single();

  if (!data) return null;

  return mapLead(data);
}
