// @bun
import {
  BUILTIN_PERSONAS,
  init_context
} from "./chunk-ekfe4t3x.js";
import"./chunk-4xshe7tf.js";
import"./chunk-tdbeghs2.js";
import"./chunk-86h8sspq.js";
import"./chunk-hkxvdww3.js";
import"./chunk-9bwery1w.js";
import"./chunk-4c08gv68.js";
import"./chunk-p9ra2v2f.js";
import"./chunk-2gzv8nrw.js";
import"./chunk-4cwfa7zk.js";
import"./chunk-mjd4qde5.js";
import"./chunk-5g7gx4y7.js";
import"./chunk-cgfdkzhb.js";
import"./chunk-sknn7p3z.js";
import"./chunk-2hb5pyjj.js";
import"./chunk-9gbamk79.js";
import"./chunk-1hjzbne1.js";
import"./chunk-djq17a7g.js";
import"./chunk-gypetngm.js";
import"./chunk-qjz5kp97.js";
import"./chunk-7m2nd8da.js";
import"./chunk-ps49ymvj.js";
import"./chunk-g338npwr.js";
import"./chunk-7nbhgtwq.js";
import"./chunk-zk2wsm7d.js";
import"./chunk-73re2yq9.js";
import"./chunk-j30w257d.js";
import"./chunk-fxerh6v6.js";
import {
  getGlobalConfig,
  init_config1 as init_config,
  saveGlobalConfig
} from "./chunk-w5d5b7r0.js";
import"./chunk-0f1005z8.js";
import"./chunk-ccq9c4dq.js";
import"./chunk-tg3zbmz7.js";
import"./chunk-3asghxv4.js";
import"./chunk-xk4zgzx2.js";
import"./chunk-g0j0t6qk.js";
import"./chunk-3c25bcsw.js";
import"./chunk-2g1tm0n3.js";
import"./chunk-55wgxwa9.js";
import"./chunk-tbpx2160.js";
import"./chunk-4jm600zv.js";
import"./chunk-7np1pz21.js";
import"./chunk-5cqfqj5r.js";
import"./chunk-f5ma3nh5.js";
import"./chunk-qz2x630m.js";
import"./chunk-1mc1wz9m.js";
import"./chunk-p2816w9z.js";
import"./chunk-v9smspw2.js";
import"./chunk-v1kzp02e.js";
import"./chunk-0vkfrmqm.js";
import"./chunk-0xjaqda8.js";
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

// src/commands/persona/persona.ts
var call = async (args) => {
  const config = getGlobalConfig();
  const arg = args.trim().toLowerCase();
  if (!arg) {
    const active = config.persona?.active;
    if (!active) {
      return {
        type: "text",
        value: `\u5F53\u524D\u672A\u8BBE\u7F6E persona\u3002\u53EF\u9009\uFF1A${Object.keys(BUILTIN_PERSONAS).join(", ")}`
      };
    }
    const builtin2 = BUILTIN_PERSONAS[active];
    const custom2 = config.persona?.custom?.[active];
    const persona2 = custom2 || builtin2;
    return {
      type: "text",
      value: `\u5F53\u524D persona\uFF1A${active}\uFF08${persona2?.name ?? active}\uFF09\u2014 ${persona2?.style ?? "\u81EA\u5B9A\u4E49"}`
    };
  }
  if (arg === "off" || arg === "none") {
    saveGlobalConfig((current) => ({
      ...current,
      persona: undefined
    }));
    return { type: "text", value: "Persona \u5DF2\u5173\u95ED" };
  }
  const allKeys = [
    ...Object.keys(BUILTIN_PERSONAS),
    ...Object.keys(config.persona?.custom ?? {})
  ];
  if (!allKeys.includes(arg)) {
    return {
      type: "text",
      value: `\u672A\u77E5 persona "${arg}"\u3002\u53EF\u9009\uFF1A${allKeys.join(", ")}\uFF0C\u6216 off \u5173\u95ED`
    };
  }
  saveGlobalConfig((current) => ({
    ...current,
    persona: {
      ...current.persona,
      active: arg
    }
  }));
  const builtin = BUILTIN_PERSONAS[arg];
  const custom = config.persona?.custom?.[arg];
  const persona = custom || builtin;
  return {
    type: "text",
    value: `\u5DF2\u5207\u6362\u5230 ${persona?.name ?? arg}\uFF1A${persona?.style ?? "\u81EA\u5B9A\u4E49"}`
  };
};
var init_persona = __esm(() => {
  init_config();
  init_context();
});
init_persona();

export {
  call
};
