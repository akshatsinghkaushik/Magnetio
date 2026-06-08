/**
 * TMDB default catalogs: Trending, Popular, Top Rated, Now Playing / On TV.
 *
 * These catalogs are available when a TMDB API key is configured.
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
 * TMDB catalog definitions
 */
export const TmdbCatalogs = {
  trending_movie: {
    id: 'tmdb_trending_movie',
    type: 'movie',
    name: 'TMDB - Trending Movies',
    endpoint: 'trending/movie/week',
  },
  trending_tv: {
    id: 'tmdb_trending_tv',
    type: 'series',
    name: 'TMDB - Trending TV',
    endpoint: 'trending/tv/week',
  },
  popular_movie: {
    id: 'tmdb_popular_movie',
    type: 'movie',
    name: 'TMDB - Popular Movies',
    endpoint: 'movie/popular',
  },
  popular_tv: {
    id: 'tmdb_popular_tv',
    type: 'series',
    name: 'TMDB - Popular TV',
    endpoint: 'tv/popular',
  },
  top_rated_movie: {
    id: 'tmdb_top_rated_movie',
    type: 'movie',
    name: 'TMDB - Top Rated Movies',
    endpoint: 'movie/top_rated',
  },
  top_rated_tv: {
    id: 'tmdb_top_rated_tv',
    type: 'series',
    name: 'TMDB - Top Rated TV',
    endpoint: 'tv/top_rated',
  },
  now_playing: {
    id: 'tmdb_now_playing',
    type: 'movie',
    name: 'TMDB - Now Playing',
    endpoint: 'movie/now_playing',
  },
  on_tv: {
    id: 'tmdb_on_tv',
    type: 'series',
    name: 'TMDB - On TV',
    endpoint: 'tv/on_the_air',
  },
};

/**
 * Fetch a TMDB catalog by catalog ID.
 *
 * @param {string} catalogId - Catalog ID (e.g. 'tmdb_trending_movie')
 * @param {string} type - 'movie' or 'series'
 * @param {string} apiKey - TMDB API key
 * @param {number} skip - Pagination skip (page offset)
 * @returns {Promise<StremioMeta[]>}
 */
export async function getTmdbCatalog(catalogId, type, apiKey, skip = 0) {
  if (!apiKey) return [];

  const catalog = Object.values(TmdbCatalogs).find(c => c.id === catalogId);
  if (!catalog) {
    logger.warn(`[TMDB Catalog] Unknown catalog: ${catalogId}`);
    return [];
  }

  const cacheKey = `tmdb-catalog:${catalogId}:${skip}`;

  return cacheWrap(cacheKey, async () => {
    try {
      const page = Math.floor(skip / 20) + 1;
      const results = await fetchList(catalog.endpoint, apiKey, page);
      return results.map(item => toStremioMeta(item, catalog.type));
    } catch (err) {
      logger.warn(`[TMDB Catalog] ${err.message}`);
      return [];
    }
  }, CACHE_TTL_LIST);
}

/**
 * Fetch a list from TMDB API.
 */
async function fetchList(endpoint, apiKey, page = 1) {
  const { data } = await axios.get(`${TMDB_BASE}/${endpoint}`, {
    timeout: REQUEST_TIMEOUT,
    params: { api_key: apiKey, page },
  });

  return data.results || [];
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
    id: `tt${item.external_ids?.imdb_id || ''}`.replace('tttt', 'tt'),
    type,
    name: title,
  };

  // Try to get IMDb ID from external IDs if available
  if (item.external_ids?.imdb_id) {
    meta.id = item.external_ids.imdb_id;
  } else if (item.id) {
    // Fallback: use TMDB ID with prefix
    meta.id = `tmdb:${type}:${item.id}`;
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
