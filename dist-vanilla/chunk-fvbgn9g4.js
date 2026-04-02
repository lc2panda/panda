// @bun
import {
  init_claudemd,
  init_withRetry
} from "./chunk-ekfe4t3x.js";
import {
  init_auth,
  init_config1 as init_config,
  init_growthbook,
  init_internalWrites,
  init_providers,
  init_settings1 as init_settings,
  init_sleep,
  init_userAgent
} from "./chunk-w5d5b7r0.js";
import {
  init_v4
} from "./chunk-g0j0t6qk.js";
import {
  exports_external,
  init_lazySchema,
  lazySchema
} from "./chunk-55wgxwa9.js";
import {
  init_oauth
} from "./chunk-5cqfqj5r.js";
import {
  init_analytics
} from "./chunk-47cb3k0q.js";
import {
  init_diagLogs,
  init_git
} from "./chunk-bjwxx22f.js";
import {
  init_errors
} from "./chunk-cv4r43rj.js";
import {
  init_settingsCache,
  init_state
} from "./chunk-24stks7b.js";
import {
  __esm
} from "./chunk-qp2qdcda.js";

// src/services/settingsSync/types.ts
var UserSyncContentSchema, UserSyncDataSchema;
var init_types = __esm(() => {
  init_v4();
  init_lazySchema();
  UserSyncContentSchema = lazySchema(() => exports_external.object({
    entries: exports_external.record(exports_external.string(), exports_external.string())
  }));
  UserSyncDataSchema = lazySchema(() => exports_external.object({
    userId: exports_external.string(),
    version: exports_external.number(),
    lastModified: exports_external.string(),
    checksum: exports_external.string(),
    content: UserSyncContentSchema()
  }));
});

// src/services/settingsSync/index.ts
var MAX_FILE_SIZE_BYTES;
var init_settingsSync = __esm(() => {
  init_state();
  init_oauth();
  init_auth();
  init_claudemd();
  init_config();
  init_diagLogs();
  init_errors();
  init_git();
  init_providers();
  init_internalWrites();
  init_settings();
  init_settingsCache();
  init_sleep();
  init_userAgent();
  init_growthbook();
  init_analytics();
  init_withRetry();
  init_types();
  MAX_FILE_SIZE_BYTES = 500 * 1024;
});

export { init_settingsSync };
