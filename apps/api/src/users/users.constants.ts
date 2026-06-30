import { ModuleType } from '../database/database.enums';

export const CATALOG_MODULE_ID = 'catalogo';

export const AVAILABLE_MODULE_IDS = [
  'operaciones',
  'clientes',
  CATALOG_MODULE_ID,
  'cotizaciones',
  'contabilidad',
  'reportes',
  'alertas-pro',
  'calendario',
] as const;

export const MODULE_SEEDS: Array<{
  code: (typeof AVAILABLE_MODULE_IDS)[number];
  moduleName: string;
  moduleType: ModuleType;
}> = [
  {
    code: 'operaciones',
    moduleName: 'Operaciones',
    moduleType: ModuleType.Basic,
  },
  { code: 'clientes', moduleName: 'Clientes', moduleType: ModuleType.Basic },
  {
    code: CATALOG_MODULE_ID,
    moduleName: 'Catálogo',
    moduleType: ModuleType.Basic,
  },
  {
    code: 'cotizaciones',
    moduleName: 'Cotizaciones',
    moduleType: ModuleType.Basic,
  },
  {
    code: 'contabilidad',
    moduleName: 'Contabilidad',
    moduleType: ModuleType.Basic,
  },
  {
    code: 'reportes',
    moduleName: 'Reportes avanzados',
    moduleType: ModuleType.Premium,
  },
  {
    code: 'alertas-pro',
    moduleName: 'Alertas inteligentes',
    moduleType: ModuleType.Premium,
  },
  {
    code: 'calendario',
    moduleName: 'Calendario',
    moduleType: ModuleType.Premium,
  },
];

export const DEFAULT_ENABLED_MODULE_IDS: Array<
  (typeof AVAILABLE_MODULE_IDS)[number]
> = MODULE_SEEDS.filter((module) => module.moduleType === ModuleType.Basic).map(
  (module) => module.code,
);
