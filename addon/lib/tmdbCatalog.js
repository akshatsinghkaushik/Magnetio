/**
 * TMDB catalogs for streaming services (What to Watch style).
 *
 * Provides catalogs for Netflix, Prime Video, Disney+, etc. by country.
 */
import axios from 'axios';
import { cacheWrap } from './cache.js';
import { logger } from './logger.js';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const POSTER_BASE = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE = 'https://image.tmdb.org/t/p/w780';

const CACHE_TTL_LIST = 3600;        // 1 hour for catalog lists
const REQUEST_TIMEOUT = 8000;

/**
 * Streaming services with their TMDB watch provider IDs.
 * https://api.themoviedb.org/3/watch/providers
 *
 * multiCountry: true = user can select country (Netflix, Prime, Disney+, Max, Apple TV+, Paramount+)
 *               false = US only (Hulu, Peacock) - same as watchnow.sliplane.app
 */
export const StreamingServices = {
  netflix:   { id: 8,   name: 'Netflix',   multiCountry: true },
  prime:     { id: 9,   name: 'Prime Video', multiCountry: true },
  disney:    { id: 337, name: 'Disney+',   multiCountry: true },
  hulu:      { id: 15,  name: 'Hulu',      multiCountry: false },
  max:       { id: 384, name: 'Max',       multiCountry: true },
  apple:     { id: 2,   name: 'Apple TV+', multiCountry: true },
  peacock:   { id: 386, name: 'Peacock',   multiCountry: false },
  paramount: { id: 531, name: 'Paramount+', multiCountry: true },
};

/**
 * Available countries for streaming catalogs.
 */
export const StreamingCountries = {
  us: 'United States',
  gb: 'United Kingdom',
  ca: 'Canada',
  au: 'Australia',
  de: 'Germany',
  fr: 'France',
  jp: 'Japan',
  in: 'India',
};

/**
 * Get all streaming service catalogs for a given config.
 * Returns catalog definitions for manifest.
 */
export function getStreamingCatalogs(config) {
  if (!config?.tmdbApiKey || !config?.streamingServices?.length) {
    return [];
  }

  const catalogs = [];
  const services = config.streamingServices || [];
  const country = config.streamingCountry || 'us';

  for (const serviceId of services) {
    const service = StreamingServices[serviceId];
    if (!service) continue;

    // Services that are US-only ignore the country selection
    const serviceCountry = service.multiCountry ? country : 'us';

    // Movie catalog
    catalogs.push({
      id: `tmdb_${serviceId}_movie_${serviceCountry}`,
      type: 'movie',
      name: `${service.name} Movies (${serviceCountry.toUpperCase()})`,
    });

    // TV catalog
    catalogs.push({
      id: `tmdb_${serviceId}_series_${serviceCountry}`,
      type: 'series',
      name: `${service.name} TV (${serviceCountry.toUpperCase()})`,
    });
  }

  return catalogs;
}

/**
 * Fetch a streaming service catalog.
 *
 * @param {string} catalogId - Catalog ID (e.g. 'tmdb_netflix_movie_us')
 * @param {string} type - 'movie' or 'series'
 * @param {string} apiKey - TMDB API key
 * @param {number} skip - Pagination skip
 * @returns {Promise<StremioMeta[]>}
 */
export async function getStreamingCatalog(catalogId, type, apiKey, skip = 0) {
  if (!apiKey) return [];

  // Parse catalog ID: tmdb_<service>_<type>_<country>
  const match = catalogId.match(/^tmdb_(\w+)_(movie|series)_([a-z]{2})$/);
  if (!match) {
    logger.warn(`[TMDB Streaming] Invalid catalog ID: ${catalogId}`);
    return [];
  }

  const [, serviceId, catalogType, country] = match;
  const service = StreamingServices[serviceId];

  if (!service) {
    logger.warn(`[TMDB Streaming] Unknown service: ${serviceId}`);
    return [];
  }

  const cacheKey = `tmdb-streaming:${catalogId}:${skip}`;

  return cacheWrap(cacheKey, async () => {
    try {
      const page = Math.floor(skip / 20) + 1;
      const endpoint = catalogType === 'series' ? 'tv' : 'movie';

      const { data } = await axios.get(`${TMDB_BASE}/discover/${endpoint}`, {
        timeout: REQUEST_TIMEOUT,
        params: {
          api_key: apiKey,
          page,
          with_watch_providers: service.id,
          watch_region: country,
          sort_by: 'popularity.desc',
        },
      });

      return (data.results || []).map(item => toStremioMeta(item, catalogType));
    } catch (err) {
      logger.warn(`[TMDB Streaming] ${err.message}`);
      return [];
    }
  }, CACHE_TTL_LIST);
}

/**
 * Convert a TMDB result to Stremio meta format.
 */
function toStremioMeta(item, type) {
  const title = item.title || item.name || '';
  const releaseDate = item.release_date || item.first_air_date || '';
  const year = releaseDate ? releaseDate.substring(0, 4) : '';
  const rating = item.vote_average ? String(Math.round(item.vote_average * 10) / 10) : '';

  const meta = {
    id: item.id ? `tmdb:${type}:${item.id}` : '',
    type,
    name: title,
  };

  if (item.external_ids?.imdb_id) {
    meta.id = item.external_ids.imdb_id;
  }

  if (item.poster_path) {
    meta.poster = `${POSTER_BASE}${item.poster_path}`;
  }

  if (item.backdrop_path) {
    meta.background = `${BACKDROP_BASE}${item.backdrop_path}`;
  }

  if (item.overview) {
    meta.description = item.overview;
  }

  if (year) {
    meta.releaseInfo = year;
  }

  if (rating) {
    meta.imdbRating = rating;
  }

  return meta;
}
