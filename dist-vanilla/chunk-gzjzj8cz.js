// @bun
import {
  init_extra_usage_core,
  runExtraUsage
} from "./chunk-d0xj8268.js";
import"./chunk-kptsbbzr.js";
import"./chunk-q94ke0f1.js";
import"./chunk-73re2yq9.js";
import"./chunk-j30w257d.js";
import"./chunk-w5d5b7r0.js";
import"./chunk-0f1005z8.js";
import"./chunk-ccq9c4dq.js";
import"./chunk-tg3zbmz7.js";
import"./chunk-3asghxv4.js";
import"./chunk-xk4zgzx2.js";
import"./chunk-g0j0t6qk.js";
import"./chunk-3c25bcsw.js";
import"./chunk-2g1tm0n3.js";
import"./chunk-55wgxwa9.js";
import"./chunk-7np1pz21.js";
import"./chunk-5cqfqj5r.js";
import"./chunk-f5ma3nh5.js";
import"./chunk-p2816w9z.js";
import"./chunk-v1kzp02e.js";
import"./chunk-ywhstzac.js";
import"./chunk-cdz5yb0r.js";
import"./chunk-47cb3k0q.js";
import"./chunk-c4pgn9ph.js";
import"./chunk-bjwxx22f.js";
import"./chunk-tjd99w4c.js";
import"./chunk-qnfx3qtx.js";
import"./chunk-7z9e9ndj.js";
import"./chunk-sctqkknr.js";
import"./chunk-ehab6nmr.js";
import"./chunk-myphr2va.js";
import"./chunk-8tnsngw2.js";
import"./chunk-wgf77cc9.js";
import"./chunk-7wm5s02e.js";
import"./chunk-cv4r43rj.js";
import"./chunk-fbv4apne.js";
import"./chunk-er95axp1.js";
import"./chunk-24stks7b.js";
import"./chunk-hqmz36b3.js";
import"./chunk-4g3v8y12.js";
import"./chunk-7739pg2c.js";
import"./chunk-xszk7n10.js";
import"./chunk-sdj9b9wh.js";
import {
  __esm
} from "./chunk-qp2qdcda.js";

// src/commands/extra-usage/extra-usage-noninteractive.ts
async function call() {
  const result = await runExtraUsage();
  if (result.type === "message") {
    return { type: "text", value: result.value };
  }
  return {
    type: "text",
    value: result.opened ? `Browser opened to manage extra usage. If it didn't open, visit: ${result.url}` : `Please visit ${result.url} to manage extra usage.`
  };
}
var init_extra_usage_noninteractive = __esm(() => {
  init_extra_usage_core();
});
init_extra_usage_noninteractive();

export {
  call
};
