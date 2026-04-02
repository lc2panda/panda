// @bun
import {
  capitalize_default,
  estimateSkillFrontmatterTokens,
  getCommandName,
  getSkillsPath,
  init_capitalize,
  init_commands1 as init_commands,
  init_loadSkillsDir
} from "./chunk-ekfe4t3x.js";
import"./chunk-4xshe7tf.js";
import"./chunk-tdbeghs2.js";
import"./chunk-86h8sspq.js";
import"./chunk-hkxvdww3.js";
import"./chunk-9bwery1w.js";
import"./chunk-4c08gv68.js";
import {
  ConfigurableShortcutHint,
  Dialog,
  init_ConfigurableShortcutHint,
  init_Dialog
} from "./chunk-p9ra2v2f.js";
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
import {
  ThemedBox_default,
  ThemedText,
  init_ink,
  require_compiler_runtime
} from "./chunk-qjz5kp97.js";
import"./chunk-7m2nd8da.js";
import"./chunk-ps49ymvj.js";
import {
  require_jsx_dev_runtime
} from "./chunk-g338npwr.js";
import"./chunk-7nbhgtwq.js";
import"./chunk-zk2wsm7d.js";
import"./chunk-73re2yq9.js";
import"./chunk-j30w257d.js";
import"./chunk-fxerh6v6.js";
import {
  getDisplayPath,
  getSettingSourceName,
  init_constants,
  init_file,
  init_stringUtils,
  plural
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
import {
  formatTokens,
  init_format
} from "./chunk-ywhstzac.js";
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
  __esm,
  __toESM
} from "./chunk-qp2qdcda.js";

// src/components/skills/SkillsMenu.tsx
function getSourceTitle(source) {
  if (source === "plugin") {
    return "Plugin skills";
  }
  if (source === "mcp") {
    return "MCP skills";
  }
  return `${capitalize_default(getSettingSourceName(source))} skills`;
}
function getSourceSubtitle(source, skills) {
  if (source === "mcp") {
    const servers = [...new Set(skills.map((s) => {
      const idx = s.name.indexOf(":");
      return idx > 0 ? s.name.slice(0, idx) : null;
    }).filter((n) => n != null))];
    return servers.length > 0 ? servers.join(", ") : undefined;
  }
  const skillsPath = getDisplayPath(getSkillsPath(source, "skills"));
  const hasCommandsSkills = skills.some((s) => s.loadedFrom === "commands_DEPRECATED");
  return hasCommandsSkills ? `${skillsPath}, ${getDisplayPath(getSkillsPath(source, "commands"))}` : skillsPath;
}
function SkillsMenu(t0) {
  const $ = import_compiler_runtime.c(35);
  const {
    onExit,
    commands
  } = t0;
  let t1;
  if ($[0] !== commands) {
    t1 = commands.filter(_temp);
    $[0] = commands;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const skills = t1;
  let groups;
  if ($[2] !== skills) {
    groups = {
      policySettings: [],
      userSettings: [],
      projectSettings: [],
      localSettings: [],
      flagSettings: [],
      plugin: [],
      mcp: []
    };
    for (const skill of skills) {
      const source = skill.source;
      if (source in groups) {
        groups[source].push(skill);
      }
    }
    for (const group of Object.values(groups)) {
      group.sort(_temp2);
    }
    $[2] = skills;
    $[3] = groups;
  } else {
    groups = $[3];
  }
  const skillsBySource = groups;
  let t2;
  if ($[4] !== onExit) {
    t2 = () => {
      onExit("Skills dialog dismissed", {
        display: "system"
      });
    };
    $[4] = onExit;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  const handleCancel = t2;
  if (skills.length === 0) {
    let t32;
    if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
      t32 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        dimColor: true,
        children: "Create skills in .pandacc/skills/ or ~/.pandacc/skills/"
      }, undefined, false, undefined, this);
      $[6] = t32;
    } else {
      t32 = $[6];
    }
    let t42;
    if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
      t42 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        dimColor: true,
        italic: true,
        children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ConfigurableShortcutHint, {
          action: "confirm:no",
          context: "Confirmation",
          fallback: "Esc",
          description: "close"
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this);
      $[7] = t42;
    } else {
      t42 = $[7];
    }
    let t52;
    if ($[8] !== handleCancel) {
      t52 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Dialog, {
        title: "Skills",
        subtitle: "No skills found",
        onCancel: handleCancel,
        hideInputGuide: true,
        children: [
          t32,
          t42
        ]
      }, undefined, true, undefined, this);
      $[8] = handleCancel;
      $[9] = t52;
    } else {
      t52 = $[9];
    }
    return t52;
  }
  const renderSkill = _temp3;
  let t3;
  if ($[10] !== skillsBySource) {
    t3 = (source_0) => {
      const groupSkills = skillsBySource[source_0];
      if (groupSkills.length === 0) {
        return null;
      }
      const title = getSourceTitle(source_0);
      const subtitle = getSourceSubtitle(source_0, groupSkills);
      return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
        flexDirection: "column",
        children: [
          /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
            children: [
              /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                bold: true,
                dimColor: true,
                children: title
              }, undefined, false, undefined, this),
              subtitle && /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
                dimColor: true,
                children: [
                  " (",
                  subtitle,
                  ")"
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this),
          groupSkills.map((skill_1) => renderSkill(skill_1))
        ]
      }, source_0, true, undefined, this);
    };
    $[10] = skillsBySource;
    $[11] = t3;
  } else {
    t3 = $[11];
  }
  const renderSkillGroup = t3;
  const t4 = skills.length;
  let t5;
  if ($[12] !== skills.length) {
    t5 = plural(skills.length, "skill");
    $[12] = skills.length;
    $[13] = t5;
  } else {
    t5 = $[13];
  }
  const t6 = `${t4} ${t5}`;
  let t7;
  if ($[14] !== renderSkillGroup) {
    t7 = renderSkillGroup("projectSettings");
    $[14] = renderSkillGroup;
    $[15] = t7;
  } else {
    t7 = $[15];
  }
  let t8;
  if ($[16] !== renderSkillGroup) {
    t8 = renderSkillGroup("userSettings");
    $[16] = renderSkillGroup;
    $[17] = t8;
  } else {
    t8 = $[17];
  }
  let t9;
  if ($[18] !== renderSkillGroup) {
    t9 = renderSkillGroup("policySettings");
    $[18] = renderSkillGroup;
    $[19] = t9;
  } else {
    t9 = $[19];
  }
  let t10;
  if ($[20] !== renderSkillGroup) {
    t10 = renderSkillGroup("plugin");
    $[20] = renderSkillGroup;
    $[21] = t10;
  } else {
    t10 = $[21];
  }
  let t11;
  if ($[22] !== renderSkillGroup) {
    t11 = renderSkillGroup("mcp");
    $[22] = renderSkillGroup;
    $[23] = t11;
  } else {
    t11 = $[23];
  }
  let t12;
  if ($[24] !== t10 || $[25] !== t11 || $[26] !== t7 || $[27] !== t8 || $[28] !== t9) {
    t12 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
      flexDirection: "column",
      gap: 1,
      children: [
        t7,
        t8,
        t9,
        t10,
        t11
      ]
    }, undefined, true, undefined, this);
    $[24] = t10;
    $[25] = t11;
    $[26] = t7;
    $[27] = t8;
    $[28] = t9;
    $[29] = t12;
  } else {
    t12 = $[29];
  }
  let t13;
  if ($[30] === Symbol.for("react.memo_cache_sentinel")) {
    t13 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
      dimColor: true,
      italic: true,
      children: /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ConfigurableShortcutHint, {
        action: "confirm:no",
        context: "Confirmation",
        fallback: "Esc",
        description: "close"
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
    $[30] = t13;
  } else {
    t13 = $[30];
  }
  let t14;
  if ($[31] !== handleCancel || $[32] !== t12 || $[33] !== t6) {
    t14 = /* @__PURE__ */ jsx_dev_runtime.jsxDEV(Dialog, {
      title: "Skills",
      subtitle: t6,
      onCancel: handleCancel,
      hideInputGuide: true,
      children: [
        t12,
        t13
      ]
    }, undefined, true, undefined, this);
    $[31] = handleCancel;
    $[32] = t12;
    $[33] = t6;
    $[34] = t14;
  } else {
    t14 = $[34];
  }
  return t14;
}
function _temp3(skill_0) {
  const estimatedTokens = estimateSkillFrontmatterTokens(skill_0);
  const tokenDisplay = `~${formatTokens(estimatedTokens)}`;
  const pluginName = skill_0.source === "plugin" ? skill_0.pluginInfo?.pluginManifest.name : undefined;
  return /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedBox_default, {
    children: [
      /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        children: getCommandName(skill_0)
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsx_dev_runtime.jsxDEV(ThemedText, {
        dimColor: true,
        children: [
          pluginName ? ` \xB7 ${pluginName}` : "",
          " \xB7 ",
          tokenDisplay,
          " description tokens"
        ]
      }, undefined, true, undefined, this)
    ]
  }, `${skill_0.name}-${skill_0.source}`, true, undefined, this);
}
function _temp2(a, b) {
  return getCommandName(a).localeCompare(getCommandName(b));
}
function _temp(cmd) {
  return cmd.type === "prompt" && (cmd.loadedFrom === "skills" || cmd.loadedFrom === "commands_DEPRECATED" || cmd.loadedFrom === "plugin" || cmd.loadedFrom === "mcp");
}
var import_compiler_runtime, jsx_dev_runtime;
var init_SkillsMenu = __esm(() => {
  init_capitalize();
  init_commands();
  init_ink();
  init_loadSkillsDir();
  init_file();
  init_format();
  init_constants();
  init_stringUtils();
  init_ConfigurableShortcutHint();
  init_Dialog();
  import_compiler_runtime = __toESM(require_compiler_runtime(), 1);
  jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
});

// src/commands/skills/skills.tsx
async function call(onDone, context) {
  return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV(SkillsMenu, {
    onExit: onDone,
    commands: context.options.commands
  }, undefined, false, undefined, this);
}
var jsx_dev_runtime2;
var init_skills = __esm(() => {
  init_SkillsMenu();
  jsx_dev_runtime2 = __toESM(require_jsx_dev_runtime(), 1);
});
init_skills();

export {
  call
};
