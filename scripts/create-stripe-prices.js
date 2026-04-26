#!/usr/bin/env node
/**
 * Script per creare automaticamente i prodotti e prezzi Stripe per Aethersy AI
 *
 * Utilizzo:
 *   node scripts/create-stripe-prices.js
 *
 * Requisiti:
 *   - STRIPE_SECRET_KEY configurata in .env.local
 */

require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PLANS = [
  {
    id: 'pro',
    name: 'Aethersy Pro',
    description: 'Per professionisti e freelance',
    monthlyPrice: 4900,      // €49.00 in centesimi
    annualPrice: 49000,      // €490.00 in centesimi
  },
  {
    id: 'business',
    name: 'Aethersy Business',
    description: 'Per team e aziende in crescita',
    monthlyPrice: 19900,     // €199.00 in centesimi
    annualPrice: 199000,     // €1990.00 in centesimi
  },
  {
    id: 'enterprise',
    name: 'Aethersy Enterprise',
    description: 'Per aziende strutturate',
    monthlyPrice: null,      // Prezzo personalizzato
    annualPrice: null,
  }
];

async function main() {
  console.log('🚀 Creazione prodotti e prezzi Stripe per Aethersy AI...\n');

  for (const plan of PLANS) {
    console.log(`\n📦 Piano: ${plan.name}`);
    console.log('─'.repeat(50));

    try {
      // 1. Cerca se il prodotto esiste già
      const existingProducts = await stripe.products.list({
        ids: [plan.id],
        limit: 1
      });

      let product;

      if (existingProducts.data.length > 0) {
        console.log(`✓ Prodotto esistente trovato: ${plan.id}`);
        product = existingProducts.data[0];
      } else {
        // 2. Crea nuovo prodotto
        product = await stripe.products.create({
          id: plan.id,
          name: plan.name,
          description: plan.description,
          metadata: {
            tier: plan.id,
            platform: 'aethersy-ai'
          }
        });
        console.log(`✓ Nuovo prodotto creato: ${plan.id}`);
      }

      // 3. Crea prezzi (se definiti)
      if (plan.monthlyPrice) {
        const existingMonthly = await stripe.prices.list({
          product: product.id,
          lookup_keys: [`${plan.id}_monthly`],
          limit: 1
        });

        if (existingMonthly.data.length === 0) {
          const monthlyPrice = await stripe.prices.create({
            product: product.id,
            unit_amount: plan.monthlyPrice,
            currency: 'eur',
            recurring: {
              interval: 'month'
            },
            lookup_key: `${plan.id}_monthly`,
            metadata: {
              plan: plan.id,
              type: 'monthly'
            }
          });
          console.log(`  ✓ Prezzo mensile creato: ${monthlyPrice.id} (€${plan.monthlyPrice/100}/mese)`);
        } else {
          console.log(`  ✓ Prezzo mensile esistente: ${existingMonthly.data[0].id}`);
        }
      }

      if (plan.annualPrice) {
        const existingAnnual = await stripe.prices.list({
          product: product.id,
          lookup_keys: [`${plan.id}_annual`],
          limit: 1
        });

        if (existingAnnual.data.length === 0) {
          const annualPrice = await stripe.prices.create({
            product: product.id,
            unit_amount: plan.annualPrice,
            currency: 'eur',
            recurring: {
              interval: 'year'
            },
            lookup_key: `${plan.id}_annual`,
            metadata: {
              plan: plan.id,
              type: 'annual',
              discount: '17%'
            }
          });
          console.log(`  ✓ Prezzo annuale creato: ${annualPrice.id} (€${plan.annualPrice/100}/anno)`);
        } else {
          console.log(`  ✓ Prezzo annuale esistente: ${existingAnnual.data[0].id}`);
        }
      }

      // 4. Stampa riepilogo
      const prices = await stripe.prices.list({ product: product.id });
      console.log('\n📊 Riepilogo:');
      console.log(`   Product ID: ${product.id}`);
      console.log(`   Nome: ${product.name}`);
      prices.data.forEach(price => {
        const amount = (price.unit_amount / 100).toFixed(2);
        const interval = price.recurring?.interval === 'year' ? '/anno' : '/mese';
        console.log(`   - Price ID: ${price.id} → €${amount}${interval}`);
      });

    } catch (error) {
      console.error(`✗ Errore per il piano ${plan.id}:`, error.message);
    }
  }

  console.log('\n✅ Operazione completata!');
  console.log('\n📝 Prossimi passi:');
  console.log('   1. Copia i Price ID dall\'output qui sopra');
  console.log('   2. Aggiornali in .env.local');
  console.log('   3. Esegui: vercel env add <NOME_VARIABILE> production --value <PRICE_ID> --yes');
  console.log('   4. Deploya: vercel --prod\n');
}

main().catch(console.error);
