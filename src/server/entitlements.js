export class EntitlementTracker{
  constructor(){this.providers={}}
  ensure(provider){return this.providers[provider]??={configuration:'not-configured',plan:'unknown',endpoints:{}}}
  configured(provider,plan='unknown'){const p=this.ensure(provider);p.configuration='configured';p.plan=plan||'unknown'}
  observe(provider,endpoint,envelope){const p=this.ensure(provider);const access=envelope.status==='live'?'verified':envelope.status==='preview'?'preview':envelope.status==='restricted'?'restricted':envelope.status==='unauthorized'?'unverified':'unknown';p.endpoints[endpoint]={access,lastStatus:envelope.status,lastObservedAt:new Date().toISOString(),asOf:envelope.asOf||null};return envelope}
  snapshot(){return{generatedAt:new Date().toISOString(),providers:structuredClone(this.providers),disclaimer:'Configuration is not entitlement. Access is verified only after a successful endpoint response.'}}
}
