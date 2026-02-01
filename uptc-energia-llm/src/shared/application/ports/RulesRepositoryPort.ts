import { Rule, RuleDSL } from '../../domain/Rule.js';

export interface CreateRuleDTO {
  name: string;
  description?: string;
  dsl: RuleDSL;
  enabled?: boolean;
}

export interface UpdateRuleDTO {
  name?: string;
  description?: string;
  dsl?: RuleDSL;
  enabled?: boolean;
}

export interface RulesRepositoryPort {
  findById(id: number): Promise<Rule | null>;
  findAll(filters?: { enabled?: boolean; sedeId?: string; sector?: string }): Promise<Rule[]>;
  create(data: CreateRuleDTO): Promise<Rule>;
  update(id: number, data: UpdateRuleDTO): Promise<Rule>;
  delete(id: number): Promise<void>;
}
