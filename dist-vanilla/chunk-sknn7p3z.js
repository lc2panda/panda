// @bun
import {
  getOAuthHeaders,
  init_api,
  prepareApiRequest
} from "./chunk-73re2yq9.js";
import {
  getGlobalConfig,
  getOauthAccountInfo,
  getSubscriptionType,
  init_auth,
  init_config1 as init_config,
  isClaudeAISubscriber,
  saveGlobalConfig
} from "./chunk-w5d5b7r0.js";
import {
  getOauthConfig,
  init_oauth
} from "./chunk-5cqfqj5r.js";
import {
  init_log,
  init_privacyLevel,
  isEssentialTrafficOnly,
  logError
} from "./chunk-myphr2va.js";
import {
  init_debug,
  logForDebugging
} from "./chunk-cv4r43rj.js";
import {
  axios_default,
  init_axios
} from "./chunk-xszk7n10.js";
import {
  __esm
} from "./chunk-qp2qdcda.js";

// src/services/api/referral.ts
async function fetchReferralEligibility(campaign = "claude_code_guest_pass") {
  const { accessToken, orgUUID } = await prepareApiRequest();
  const headers = {
    ...getOAuthHeaders(accessToken),
    "x-organization-uuid": orgUUID
  };
  const url = `${getOauthConfig().BASE_API_URL}/api/oauth/organizations/${orgUUID}/referral/eligibility`;
  const response = await axios_default.get(url, {
    headers,
    params: { campaign },
    timeout: 5000
  });
  return response.data;
}
async function fetchReferralRedemptions(campaign = "claude_code_guest_pass") {
  const { accessToken, orgUUID } = await prepareApiRequest();
  const headers = {
    ...getOAuthHeaders(accessToken),
    "x-organization-uuid": orgUUID
  };
  const url = `${getOauthConfig().BASE_API_URL}/api/oauth/organizations/${orgUUID}/referral/redemptions`;
  const response = await axios_default.get(url, {
    headers,
    params: { campaign },
    timeout: 1e4
  });
  return response.data;
}
function shouldCheckForPasses() {
  return !!(getOauthAccountInfo()?.organizationUuid && isClaudeAISubscriber() && getSubscriptionType() === "max");
}
function checkCachedPassesEligibility() {
  if (!shouldCheckForPasses()) {
    return {
      eligible: false,
      needsRefresh: false,
      hasCache: false
    };
  }
  const orgId = getOauthAccountInfo()?.organizationUuid;
  if (!orgId) {
    return {
      eligible: false,
      needsRefresh: false,
      hasCache: false
    };
  }
  const config = getGlobalConfig();
  const cachedEntry = config.passesEligibilityCache?.[orgId];
  if (!cachedEntry) {
    return {
      eligible: false,
      needsRefresh: true,
      hasCache: false
    };
  }
  const { eligible, timestamp } = cachedEntry;
  const now = Date.now();
  const needsRefresh = now - timestamp > CACHE_EXPIRATION_MS;
  return {
    eligible,
    needsRefresh,
    hasCache: true
  };
}
function formatCreditAmount(reward) {
  const symbol = CURRENCY_SYMBOLS[reward.currency] ?? `${reward.currency} `;
  const amount = reward.amount_minor_units / 100;
  const formatted = amount % 1 === 0 ? amount.toString() : amount.toFixed(2);
  return `${symbol}${formatted}`;
}
function getCachedReferrerReward() {
  const orgId = getOauthAccountInfo()?.organizationUuid;
  if (!orgId)
    return null;
  const config = getGlobalConfig();
  const cachedEntry = config.passesEligibilityCache?.[orgId];
  return cachedEntry?.referrer_reward ?? null;
}
function getCachedRemainingPasses() {
  const orgId = getOauthAccountInfo()?.organizationUuid;
  if (!orgId)
    return null;
  const config = getGlobalConfig();
  const cachedEntry = config.passesEligibilityCache?.[orgId];
  return cachedEntry?.remaining_passes ?? null;
}
async function fetchAndStorePassesEligibility() {
  if (fetchInProgress) {
    logForDebugging("Passes: Reusing in-flight eligibility fetch");
    return fetchInProgress;
  }
  const orgId = getOauthAccountInfo()?.organizationUuid;
  if (!orgId) {
    return null;
  }
  fetchInProgress = (async () => {
    try {
      const response = await fetchReferralEligibility();
      const cacheEntry = {
        ...response,
        timestamp: Date.now()
      };
      saveGlobalConfig((current) => ({
        ...current,
        passesEligibilityCache: {
          ...current.passesEligibilityCache,
          [orgId]: cacheEntry
        }
      }));
      logForDebugging(`Passes eligibility cached for org ${orgId}: ${response.eligible}`);
      return response;
    } catch (error) {
      logForDebugging("Failed to fetch and cache passes eligibility");
      logError(error);
      return null;
    } finally {
      fetchInProgress = null;
    }
  })();
  return fetchInProgress;
}
async function getCachedOrFetchPassesEligibility() {
  if (!shouldCheckForPasses()) {
    return null;
  }
  const orgId = getOauthAccountInfo()?.organizationUuid;
  if (!orgId) {
    return null;
  }
  const config = getGlobalConfig();
  const cachedEntry = config.passesEligibilityCache?.[orgId];
  const now = Date.now();
  if (!cachedEntry) {
    logForDebugging("Passes: No cache, fetching eligibility in background (command unavailable this session)");
    fetchAndStorePassesEligibility();
    return null;
  }
  if (now - cachedEntry.timestamp > CACHE_EXPIRATION_MS) {
    logForDebugging("Passes: Cache stale, returning cached data and refreshing in background");
    fetchAndStorePassesEligibility();
    const { timestamp: timestamp2, ...response2 } = cachedEntry;
    return response2;
  }
  logForDebugging("Passes: Using fresh cached eligibility data");
  const { timestamp, ...response } = cachedEntry;
  return response;
}
async function prefetchPassesEligibility() {
  if (isEssentialTrafficOnly()) {
    return;
  }
  getCachedOrFetchPassesEligibility();
}
var CACHE_EXPIRATION_MS, fetchInProgress = null, CURRENCY_SYMBOLS;
var init_referral = __esm(() => {
  init_axios();
  init_oauth();
  init_auth();
  init_config();
  init_debug();
  init_log();
  init_privacyLevel();
  init_api();
  CACHE_EXPIRATION_MS = 24 * 60 * 60 * 1000;
  CURRENCY_SYMBOLS = {
    USD: "$",
    EUR: "\u20AC",
    GBP: "\xA3",
    BRL: "R$",
    CAD: "CA$",
    AUD: "A$",
    NZD: "NZ$",
    SGD: "S$"
  };
});

export { fetchReferralRedemptions, checkCachedPassesEligibility, formatCreditAmount, getCachedReferrerReward, getCachedRemainingPasses, getCachedOrFetchPassesEligibility, prefetchPassesEligibility, init_referral };
