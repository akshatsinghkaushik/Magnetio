/**
 * Central registry of all supported debrid / cloud-download services.
 *
 * Each entry describes:
 *   id              – URL-safe identifier used in catalog IDs
 *   configKey       – the config property that holds this service's API key
 *   catalogFlagKey  – the config property that enables/disables catalog for this service
 *   shortName       – abbreviated name shown in the addon title
 *   name            – full display name
 *   hasCatalog      – whether the service exposes a browsable catalog
 */
export const MochOptions = {
  realdebrid: {
    id:             'rd',
    configKey:      'realDebridApiKey',
    catalogFlagKey: 'realDebridCatalogEnabled',
    shortName:      'RD',
    name:           'Real-Debrid',
    hasCatalog:     true,
  },
  premiumize: {
    id:             'pm',
    configKey:      'premiumizeApiKey',
    catalogFlagKey: 'premiumizeCatalogEnabled',
    shortName:      'PM',
    name:           'Premiumize',
    hasCatalog:     true,
  },
  alldebrid: {
    id:             'ad',
    configKey:      'allDebridApiKey',
    catalogFlagKey: null,
    shortName:      'AD',
    name:           'AllDebrid',
    hasCatalog:     false,
  },
  debridlink: {
    id:             'dl',
    configKey:      'debridLinkApiKey',
    catalogFlagKey: 'debridLinkCatalogEnabled',
    shortName:      'DL',
    name:           'DebridLink',
    hasCatalog:     true,
  },
  easydebrid: {
    id:             'ed',
    configKey:      'easyDebridApiKey',
    catalogFlagKey: null,
    shortName:      'ED',
    name:           'EasyDebrid',
    hasCatalog:     false,
  },
  offcloud: {
    id:             'oc',
    configKey:      'offcloudApiKey',
    catalogFlagKey: null,
    shortName:      'OC',
    name:           'Offcloud',
    hasCatalog:     false,
  },
  torbox: {
    id:             'tb',
    configKey:      'torboxApiKey',
    catalogFlagKey: 'torboxCatalogEnabled',
    shortName:      'TB',
    name:           'TorBox',
    hasCatalog:     true,
  },
  putio: {
    id:             'pu',
    configKey:      'putioApiKey',
    catalogFlagKey: 'putioCatalogEnabled',
    shortName:      'PU',
    name:           'Put.io',
    hasCatalog:     true,
  },
};

/** Minimum API-key length to be considered valid. */
export const MIN_API_KEY_LENGTH = 15;
