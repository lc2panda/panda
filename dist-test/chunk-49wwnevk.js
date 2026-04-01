// @bun
import {
  init_browser,
  openBrowser
} from "./chunk-e046tp8q.js";
import"./chunk-nahdbxge.js";
import"./chunk-43vdtd69.js";
import"./chunk-8tnsngw2.js";
import"./chunk-wgf77cc9.js";
import"./chunk-7wm5s02e.js";
import"./chunk-71hncdva.js";
import"./chunk-fbv4apne.js";
import"./chunk-3r24h7t6.js";
import"./chunk-24stks7b.js";
import"./chunk-hqmz36b3.js";
import"./chunk-4g3v8y12.js";
import"./chunk-7739pg2c.js";
import {
  __esm
} from "./chunk-qp2qdcda.js";

// src/commands/stickers/stickers.ts
async function call() {
  const url = "https://www.stickermule.com/claudecode";
  const success = await openBrowser(url);
  if (success) {
    return { type: "text", value: "Opening sticker page in browser\u2026" };
  } else {
    return {
      type: "text",
      value: `Failed to open browser. Visit: ${url}`
    };
  }
}
var init_stickers = __esm(() => {
  init_browser();
});
init_stickers();

export {
  call
};
