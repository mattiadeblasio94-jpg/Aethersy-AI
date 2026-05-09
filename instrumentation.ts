// OpenTelemetry instrumentation per Vercel
// Nota: @vercel/otel non espone registerOpentelemetry direttamente
// Usiamo l'auto-strumentazione di Vercel con configurazione env

export function register() {
  // Vercel OTel auto-configuration via environment variables
  // Le seguenti variabili d'ambiente configurano automaticamente OTel:
  // - OTEL_SERVICE_NAME = aethersy-aiforge-pro
  // - OTEL_EXPORTER_OTLP_ENDPOINT = endpoint per Braintrust/Vercel
  // - OTEL_TRACES_SAMPLER = parentbased_traceidratio
  // - OTEL_TRACES_SAMPLER_ARG = 0.2 (20% sampling)

  if (process.env.OTEL_ENABLED === 'true') {
    console.log('[OTel] OpenTelemetry configurato per aethersy-aiforge-pro');
  }
}
