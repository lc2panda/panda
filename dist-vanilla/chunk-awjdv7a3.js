// @bun
import {
  cacheKeys,
  init_fileStateCache
} from "./chunk-9gbamk79.js";
import"./chunk-qnfx3qtx.js";
import {
  getCwd,
  init_cwd
} from "./chunk-wgf77cc9.js";
import"./chunk-24stks7b.js";
import"./chunk-hqmz36b3.js";
import {
  __esm
} from "./chunk-qp2qdcda.js";

// src/commands/files/files.ts
import { relative } from "path";
async function call(_args, context) {
  const files = context.readFileState ? cacheKeys(context.readFileState) : [];
  if (files.length === 0) {
    return { type: "text", value: "No files in context" };
  }
  const fileList = files.map((file) => relative(getCwd(), file)).join(`
`);
  return { type: "text", value: `Files in context:
${fileList}` };
}
var init_files = __esm(() => {
  init_cwd();
  init_fileStateCache();
});
init_files();

export {
  call
};
