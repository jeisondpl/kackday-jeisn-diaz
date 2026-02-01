/**
 * Value Objects - Immutable domain primitives
 * Following DDD principles
 */

export class SedeRef {
  constructor(id, nombre) {
    if (!id || typeof id !== 'string') {
      throw new Error('SedeRef requires valid id');
    }
    this.id = id;
    this.nombre = nombre || id;
    Object.freeze(this);
  }

  equals(other) {
    return other instanceof SedeRef && other.id === this.id;
  }

  toString() {
    return this.id;
  }
}

export class Sector {
  static COMEDORES = 'comedores';
  static SALONES = 'salones';
  static LABORATORIOS = 'laboratorios';
  static AUDITORIOS = 'auditorios';
  static OFICINAS = 'oficinas';

  static ALL = [
    Sector.COMEDORES,
    Sector.SALONES,
    Sector.LABORATORIOS,
    Sector.AUDITORIOS,
    Sector.OFICINAS,
  ];

  static isValid(value) {
    return Sector.ALL.includes(value);
  }

  static validate(value) {
    if (!Sector.isValid(value)) {
      throw new Error(`Invalid sector: ${value}. Must be one of: ${Sector.ALL.join(', ')}`);
    }
    return value;
  }
}

export class Severity {
  static LOW = 'low';
  static MEDIUM = 'medium';
  static HIGH = 'high';
  static CRITICAL = 'critical';

  static ALL = [Severity.LOW, Severity.MEDIUM, Severity.HIGH, Severity.CRITICAL];

  static isValid(value) {
    return Severity.ALL.includes(value);
  }

  static validate(value) {
    if (!Severity.isValid(value)) {
      throw new Error(`Invalid severity: ${value}. Must be one of: ${Severity.ALL.join(', ')}`);
    }
    return value;
  }
}

export class AlertStatus {
  static OPEN = 'open';
  static ACKNOWLEDGED = 'acknowledged';
  static RESOLVED = 'resolved';
  static DISMISSED = 'dismissed';

  static ALL = [AlertStatus.OPEN, AlertStatus.ACKNOWLEDGED, AlertStatus.RESOLVED, AlertStatus.DISMISSED];

  static isValid(value) {
    return AlertStatus.ALL.includes(value);
  }

  static validate(value) {
    if (!AlertStatus.isValid(value)) {
      throw new Error(`Invalid alert status: ${value}. Must be one of: ${AlertStatus.ALL.join(', ')}`);
    }
    return value;
  }
}

export class TimeWindow {
  constructor(granularity, lookbackHours = 24) {
    if (!['hour', 'day', 'week', 'month'].includes(granularity)) {
      throw new Error('Invalid granularity. Must be: hour, day, week, or month');
    }
    if (lookbackHours <= 0) {
      throw new Error('lookbackHours must be positive');
    }
    this.granularity = granularity;
    this.lookbackHours = lookbackHours;
    Object.freeze(this);
  }
}

export class Schedule {
  constructor(allowedIntervals = []) {
    if (!Array.isArray(allowedIntervals)) {
      throw new Error('allowedIntervals must be an array');
    }
    this.allowed = allowedIntervals.map((interval) => {
      if (!interval.from || !interval.to) {
        throw new Error('Each interval must have from and to times');
      }
      return { from: interval.from, to: interval.to };
    });
    Object.freeze(this);
  }

  isWithinSchedule(timeString) {
    if (!this.allowed.length) return true;
    return this.allowed.some((interval) => {
      return timeString >= interval.from && timeString <= interval.to;
    });
  }
}

export class MetricValue {
  constructor(value, unit, timestamp) {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new Error('MetricValue requires numeric value');
    }
    this.value = value;
    this.unit = unit;
    this.timestamp = timestamp ? new Date(timestamp) : new Date();
    Object.freeze(this);
  }
}
