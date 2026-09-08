import type {AurynV7Analysis} from './domain';
import {serializeV6Decision} from '../v6/learning';

export function serializeV7Decision(v7:AurynV7Analysis){
  return{
    ...serializeV6Decision(v7.v6),
    version:v7.version,
    engineVersion:v7.engineVersion,
    trust:{state:v7.trust.state,score:v7.trust.score,blockers:v7.trust.blockers,warnings:v7.trust.warnings},
  };
}
