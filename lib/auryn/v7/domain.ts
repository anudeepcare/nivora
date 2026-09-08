import type {AurynV6Analysis} from '../v6/domain';
import type {CanonicalTrustAudit} from './trust-audit';

export interface AurynV7Analysis{
  version:'auryn-v7';
  engineVersion:string;
  snapshotId:string;
  symbol:string;
  asOf:string;
  v6:AurynV6Analysis;
  trust:CanonicalTrustAudit;
}
