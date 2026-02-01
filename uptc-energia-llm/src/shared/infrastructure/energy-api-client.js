/**
 * HTTP Energy API Adapter
 * Implements EnergyApiPort to consume UPTC Energy API
 */

import { EnergyApiPort } from '../domain/ports.js';
import config from '../config/index.js';

export class HttpEnergyApiAdapter extends EnergyApiPort {
  constructor(baseUrl = config.energyApiBaseUrl, logger = console) {
    super();
    this.baseUrl = baseUrl.replace(/\/$/, ''); // remove trailing slash
    this.logger = logger;
  }

  async _fetch(path, options = {}) {
    const url = `${this.baseUrl}${path}`;
    this.logger.debug(`Energy API request: ${url}`);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Energy API error (${response.status}): ${error}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error({ err: error, url }, 'Energy API request failed');
      throw error;
    }
  }

  _buildQueryString(params) {
    const filtered = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    return filtered.length > 0 ? `?${filtered.join('&')}` : '';
  }

  async getHealth() {
    return await this._fetch('/health');
  }

  async getSedes(withStats = false) {
    const query = this._buildQueryString({ with_stats: withStats });
    return await this._fetch(`/sedes${query}`);
  }

  async getSede(sedeId) {
    return await this._fetch(`/sedes/${sedeId}`);
  }

  async getConsumos(filters = {}) {
    const { sedeId, from, to, limit, offset, order } = filters;
    const query = this._buildQueryString({
      sede_id: sedeId,
      from,
      to,
      limit: limit || 100,
      offset,
      order,
    });
    return await this._fetch(`/consumos${query}`);
  }

  async getStatsDiario(filters = {}) {
    const { sedeId, from, to, limit, offset } = filters;
    const query = this._buildQueryString({
      sede_id: sedeId,
      from,
      to,
      limit,
      offset,
    });
    return await this._fetch(`/stats/diario${query}`);
  }

  async getStatsSector(filters = {}) {
    const { sedeId, from, to, limit } = filters;
    const query = this._buildQueryString({
      sede_id: sedeId,
      from,
      to,
      limit,
    });
    return await this._fetch(`/stats/sector${query}`);
  }

  async getStatsHorario(filters = {}) {
    const { sedeId, esFinSemana } = filters;
    const query = this._buildQueryString({
      sede_id: sedeId,
      es_fin_semana: esFinSemana,
    });
    return await this._fetch(`/stats/horario${query}`);
  }

  async getStatsPeriodo(filters = {}) {
    const { sedeId, año } = filters;
    const query = this._buildQueryString({
      sede_id: sedeId,
      año,
    });
    return await this._fetch(`/stats/periodo${query}`);
  }

  async getStatsSummary(filters = {}) {
    const { sedeId } = filters;
    const query = this._buildQueryString({ sede_id: sedeId });
    return await this._fetch(`/stats/summary${query}`);
  }
}

export default HttpEnergyApiAdapter;
