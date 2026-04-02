// @bun
import {
  getGraphemeSegmenter,
  getRelativeTimeFormat,
  getTimeZone,
  init_intl
} from "./chunk-cdz5yb0r.js";
import {
  init_analytics,
  logEvent
} from "./chunk-47cb3k0q.js";
import {
  getFsImplementation,
  init_debug,
  init_fsOperations,
  init_slowOperations,
  logForDebugging,
  writeFileSync_DEPRECATED
} from "./chunk-cv4r43rj.js";
import {
  getClaudeConfigHomeDir,
  init_envUtils,
  isEnvTruthy
} from "./chunk-er95axp1.js";
import {
  getSessionId,
  init_state
} from "./chunk-24stks7b.js";
import {
  __esm,
  __require
} from "./chunk-qp2qdcda.js";

// node_modules/.bun/emoji-regex@10.6.0/node_modules/emoji-regex/index.mjs
var emoji_regex_default = () => {
  return /[#*0-9]\uFE0F?\u20E3|[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23ED-\u23EF\u23F1\u23F2\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692\u2694-\u2697\u2699\u269B\u269C\u26A0\u26A7\u26AA\u26B0\u26B1\u26BD\u26BE\u26C4\u26C8\u26CF\u26D1\u26E9\u26F0-\u26F5\u26F7\u26F8\u26FA\u2702\u2708\u2709\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u2757\u2763\u27A1\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B55\u3030\u303D\u3297\u3299]\uFE0F?|[\u261D\u270C\u270D](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?|[\u270A\u270B](?:\uD83C[\uDFFB-\uDFFF])?|[\u23E9-\u23EC\u23F0\u23F3\u25FD\u2693\u26A1\u26AB\u26C5\u26CE\u26D4\u26EA\u26FD\u2705\u2728\u274C\u274E\u2753-\u2755\u2795-\u2797\u27B0\u27BF\u2B50]|\u26D3\uFE0F?(?:\u200D\uD83D\uDCA5)?|\u26F9(?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|\u2764\uFE0F?(?:\u200D(?:\uD83D\uDD25|\uD83E\uDE79))?|\uD83C(?:[\uDC04\uDD70\uDD71\uDD7E\uDD7F\uDE02\uDE37\uDF21\uDF24-\uDF2C\uDF36\uDF7D\uDF96\uDF97\uDF99-\uDF9B\uDF9E\uDF9F\uDFCD\uDFCE\uDFD4-\uDFDF\uDFF5\uDFF7]\uFE0F?|[\uDF85\uDFC2\uDFC7](?:\uD83C[\uDFFB-\uDFFF])?|[\uDFC4\uDFCA](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDFCB\uDFCC](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDCCF\uDD8E\uDD91-\uDD9A\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF43\uDF45-\uDF4A\uDF4C-\uDF7C\uDF7E-\uDF84\uDF86-\uDF93\uDFA0-\uDFC1\uDFC5\uDFC6\uDFC8\uDFC9\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF8-\uDFFF]|\uDDE6\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF]|\uDDE7\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF]|\uDDE8\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF7\uDDFA-\uDDFF]|\uDDE9\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF]|\uDDEA\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA]|\uDDEB\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7]|\uDDEC\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE]|\uDDED\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA]|\uDDEE\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9]|\uDDEF\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5]|\uDDF0\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF]|\uDDF1\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE]|\uDDF2\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF]|\uDDF3\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF]|\uDDF4\uD83C\uDDF2|\uDDF5\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE]|\uDDF6\uD83C\uDDE6|\uDDF7\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC]|\uDDF8\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF]|\uDDF9\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF]|\uDDFA\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF]|\uDDFB\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA]|\uDDFC\uD83C[\uDDEB\uDDF8]|\uDDFD\uD83C\uDDF0|\uDDFE\uD83C[\uDDEA\uDDF9]|\uDDFF\uD83C[\uDDE6\uDDF2\uDDFC]|\uDF44(?:\u200D\uD83D\uDFEB)?|\uDF4B(?:\u200D\uD83D\uDFE9)?|\uDFC3(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDFF3\uFE0F?(?:\u200D(?:\u26A7\uFE0F?|\uD83C\uDF08))?|\uDFF4(?:\u200D\u2620\uFE0F?|\uDB40\uDC67\uDB40\uDC62\uDB40(?:\uDC65\uDB40\uDC6E\uDB40\uDC67|\uDC73\uDB40\uDC63\uDB40\uDC74|\uDC77\uDB40\uDC6C\uDB40\uDC73)\uDB40\uDC7F)?)|\uD83D(?:[\uDC3F\uDCFD\uDD49\uDD4A\uDD6F\uDD70\uDD73\uDD76-\uDD79\uDD87\uDD8A-\uDD8D\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA\uDECB\uDECD-\uDECF\uDEE0-\uDEE5\uDEE9\uDEF0\uDEF3]\uFE0F?|[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC](?:\uD83C[\uDFFB-\uDFFF])?|[\uDC6E-\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4\uDEB5](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD74\uDD90](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?|[\uDC00-\uDC07\uDC09-\uDC14\uDC16-\uDC25\uDC27-\uDC3A\uDC3C-\uDC3E\uDC40\uDC44\uDC45\uDC51-\uDC65\uDC6A\uDC79-\uDC7B\uDC7D-\uDC80\uDC84\uDC88-\uDC8E\uDC90\uDC92-\uDCA9\uDCAB-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDDA4\uDDFB-\uDE2D\uDE2F-\uDE34\uDE37-\uDE41\uDE43\uDE44\uDE48-\uDE4A\uDE80-\uDEA2\uDEA4-\uDEB3\uDEB7-\uDEBF\uDEC1-\uDEC5\uDED0-\uDED2\uDED5-\uDED8\uDEDC-\uDEDF\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB\uDFF0]|\uDC08(?:\u200D\u2B1B)?|\uDC15(?:\u200D\uD83E\uDDBA)?|\uDC26(?:\u200D(?:\u2B1B|\uD83D\uDD25))?|\uDC3B(?:\u200D\u2744\uFE0F?)?|\uDC41\uFE0F?(?:\u200D\uD83D\uDDE8\uFE0F?)?|\uDC68(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDC68\uDC69]\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFC-\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFC-\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFD-\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFD\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFE])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFE]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?))?|\uDC69(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?[\uDC68\uDC69]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?|\uDC69\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?))|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFC-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFC-\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFD-\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFD\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFE])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFE]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFE])))?))?|\uDD75(?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|\uDE2E(?:\u200D\uD83D\uDCA8)?|\uDE35(?:\u200D\uD83D\uDCAB)?|\uDE36(?:\u200D\uD83C\uDF2B\uFE0F?)?|\uDE42(?:\u200D[\u2194\u2195]\uFE0F?)?|\uDEB6(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?)|\uD83E(?:[\uDD0C\uDD0F\uDD18-\uDD1F\uDD30-\uDD34\uDD36\uDD77\uDDB5\uDDB6\uDDBB\uDDD2\uDDD3\uDDD5\uDEC3-\uDEC5\uDEF0\uDEF2-\uDEF8](?:\uD83C[\uDFFB-\uDFFF])?|[\uDD26\uDD35\uDD37-\uDD39\uDD3C-\uDD3E\uDDB8\uDDB9\uDDCD\uDDCF\uDDD4\uDDD6-\uDDDD](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDDDE\uDDDF](?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD0D\uDD0E\uDD10-\uDD17\uDD20-\uDD25\uDD27-\uDD2F\uDD3A\uDD3F-\uDD45\uDD47-\uDD76\uDD78-\uDDB4\uDDB7\uDDBA\uDDBC-\uDDCC\uDDD0\uDDE0-\uDDFF\uDE70-\uDE7C\uDE80-\uDE8A\uDE8E-\uDEC2\uDEC6\uDEC8\uDECD-\uDEDC\uDEDF-\uDEEA\uDEEF]|\uDDCE(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDDD1(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1|\uDDD1\u200D\uD83E\uDDD2(?:\u200D\uD83E\uDDD2)?|\uDDD2(?:\u200D\uD83E\uDDD2)?))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE])))?))?|\uDEF1(?:\uD83C(?:\uDFFB(?:\u200D\uD83E\uDEF2\uD83C[\uDFFC-\uDFFF])?|\uDFFC(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFD-\uDFFF])?|\uDFFD(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])?|\uDFFE(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFD\uDFFF])?|\uDFFF(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFE])?))?)/g;
};
var init_emoji_regex = () => {};

// node_modules/.bun/get-east-asian-width@1.5.0/node_modules/get-east-asian-width/lookup-data.js
var ambiguousRanges, fullwidthRanges, halfwidthRanges, narrowRanges, wideRanges;
var init_lookup_data = __esm(() => {
  ambiguousRanges = [161, 161, 164, 164, 167, 168, 170, 170, 173, 174, 176, 180, 182, 186, 188, 191, 198, 198, 208, 208, 215, 216, 222, 225, 230, 230, 232, 234, 236, 237, 240, 240, 242, 243, 247, 250, 252, 252, 254, 254, 257, 257, 273, 273, 275, 275, 283, 283, 294, 295, 299, 299, 305, 307, 312, 312, 319, 322, 324, 324, 328, 331, 333, 333, 338, 339, 358, 359, 363, 363, 462, 462, 464, 464, 466, 466, 468, 468, 470, 470, 472, 472, 474, 474, 476, 476, 593, 593, 609, 609, 708, 708, 711, 711, 713, 715, 717, 717, 720, 720, 728, 731, 733, 733, 735, 735, 768, 879, 913, 929, 931, 937, 945, 961, 963, 969, 1025, 1025, 1040, 1103, 1105, 1105, 8208, 8208, 8211, 8214, 8216, 8217, 8220, 8221, 8224, 8226, 8228, 8231, 8240, 8240, 8242, 8243, 8245, 8245, 8251, 8251, 8254, 8254, 8308, 8308, 8319, 8319, 8321, 8324, 8364, 8364, 8451, 8451, 8453, 8453, 8457, 8457, 8467, 8467, 8470, 8470, 8481, 8482, 8486, 8486, 8491, 8491, 8531, 8532, 8539, 8542, 8544, 8555, 8560, 8569, 8585, 8585, 8592, 8601, 8632, 8633, 8658, 8658, 8660, 8660, 8679, 8679, 8704, 8704, 8706, 8707, 8711, 8712, 8715, 8715, 8719, 8719, 8721, 8721, 8725, 8725, 8730, 8730, 8733, 8736, 8739, 8739, 8741, 8741, 8743, 8748, 8750, 8750, 8756, 8759, 8764, 8765, 8776, 8776, 8780, 8780, 8786, 8786, 8800, 8801, 8804, 8807, 8810, 8811, 8814, 8815, 8834, 8835, 8838, 8839, 8853, 8853, 8857, 8857, 8869, 8869, 8895, 8895, 8978, 8978, 9312, 9449, 9451, 9547, 9552, 9587, 9600, 9615, 9618, 9621, 9632, 9633, 9635, 9641, 9650, 9651, 9654, 9655, 9660, 9661, 9664, 9665, 9670, 9672, 9675, 9675, 9678, 9681, 9698, 9701, 9711, 9711, 9733, 9734, 9737, 9737, 9742, 9743, 9756, 9756, 9758, 9758, 9792, 9792, 9794, 9794, 9824, 9825, 9827, 9829, 9831, 9834, 9836, 9837, 9839, 9839, 9886, 9887, 9919, 9919, 9926, 9933, 9935, 9939, 9941, 9953, 9955, 9955, 9960, 9961, 9963, 9969, 9972, 9972, 9974, 9977, 9979, 9980, 9982, 9983, 10045, 10045, 10102, 10111, 11094, 11097, 12872, 12879, 57344, 63743, 65024, 65039, 65533, 65533, 127232, 127242, 127248, 127277, 127280, 127337, 127344, 127373, 127375, 127376, 127387, 127404, 917760, 917999, 983040, 1048573, 1048576, 1114109];
  fullwidthRanges = [12288, 12288, 65281, 65376, 65504, 65510];
  halfwidthRanges = [8361, 8361, 65377, 65470, 65474, 65479, 65482, 65487, 65490, 65495, 65498, 65500, 65512, 65518];
  narrowRanges = [32, 126, 162, 163, 165, 166, 172, 172, 175, 175, 10214, 10221, 10629, 10630];
  wideRanges = [4352, 4447, 8986, 8987, 9001, 9002, 9193, 9196, 9200, 9200, 9203, 9203, 9725, 9726, 9748, 9749, 9776, 9783, 9800, 9811, 9855, 9855, 9866, 9871, 9875, 9875, 9889, 9889, 9898, 9899, 9917, 9918, 9924, 9925, 9934, 9934, 9940, 9940, 9962, 9962, 9970, 9971, 9973, 9973, 9978, 9978, 9981, 9981, 9989, 9989, 9994, 9995, 10024, 10024, 10060, 10060, 10062, 10062, 10067, 10069, 10071, 10071, 10133, 10135, 10160, 10160, 10175, 10175, 11035, 11036, 11088, 11088, 11093, 11093, 11904, 11929, 11931, 12019, 12032, 12245, 12272, 12287, 12289, 12350, 12353, 12438, 12441, 12543, 12549, 12591, 12593, 12686, 12688, 12773, 12783, 12830, 12832, 12871, 12880, 42124, 42128, 42182, 43360, 43388, 44032, 55203, 63744, 64255, 65040, 65049, 65072, 65106, 65108, 65126, 65128, 65131, 94176, 94180, 94192, 94198, 94208, 101589, 101631, 101662, 101760, 101874, 110576, 110579, 110581, 110587, 110589, 110590, 110592, 110882, 110898, 110898, 110928, 110930, 110933, 110933, 110948, 110951, 110960, 111355, 119552, 119638, 119648, 119670, 126980, 126980, 127183, 127183, 127374, 127374, 127377, 127386, 127488, 127490, 127504, 127547, 127552, 127560, 127568, 127569, 127584, 127589, 127744, 127776, 127789, 127797, 127799, 127868, 127870, 127891, 127904, 127946, 127951, 127955, 127968, 127984, 127988, 127988, 127992, 128062, 128064, 128064, 128066, 128252, 128255, 128317, 128331, 128334, 128336, 128359, 128378, 128378, 128405, 128406, 128420, 128420, 128507, 128591, 128640, 128709, 128716, 128716, 128720, 128722, 128725, 128728, 128732, 128735, 128747, 128748, 128756, 128764, 128992, 129003, 129008, 129008, 129292, 129338, 129340, 129349, 129351, 129535, 129648, 129660, 129664, 129674, 129678, 129734, 129736, 129736, 129741, 129756, 129759, 129770, 129775, 129784, 131072, 196605, 196608, 262141];
});

// node_modules/.bun/get-east-asian-width@1.5.0/node_modules/get-east-asian-width/utilities.js
var isInRange = (ranges, codePoint) => {
  let low = 0;
  let high = Math.floor(ranges.length / 2) - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const i = mid * 2;
    if (codePoint < ranges[i]) {
      high = mid - 1;
    } else if (codePoint > ranges[i + 1]) {
      low = mid + 1;
    } else {
      return true;
    }
  }
  return false;
};
var init_utilities = () => {};

// node_modules/.bun/get-east-asian-width@1.5.0/node_modules/get-east-asian-width/lookup.js
function findWideFastPathRange(ranges) {
  let fastPathStart = ranges[0];
  let fastPathEnd = ranges[1];
  for (let index = 0;index < ranges.length; index += 2) {
    const start = ranges[index];
    const end = ranges[index + 1];
    if (commonCjkCodePoint >= start && commonCjkCodePoint <= end) {
      return [start, end];
    }
    if (end - start > fastPathEnd - fastPathStart) {
      fastPathStart = start;
      fastPathEnd = end;
    }
  }
  return [fastPathStart, fastPathEnd];
}
var minimumAmbiguousCodePoint, maximumAmbiguousCodePoint, minimumFullWidthCodePoint, maximumFullWidthCodePoint, minimumHalfWidthCodePoint, maximumHalfWidthCodePoint, minimumNarrowCodePoint, maximumNarrowCodePoint, minimumWideCodePoint, maximumWideCodePoint, commonCjkCodePoint = 19968, wideFastPathStart, wideFastPathEnd, isAmbiguous = (codePoint) => {
  if (codePoint < minimumAmbiguousCodePoint || codePoint > maximumAmbiguousCodePoint) {
    return false;
  }
  return isInRange(ambiguousRanges, codePoint);
}, isFullWidth = (codePoint) => {
  if (codePoint < minimumFullWidthCodePoint || codePoint > maximumFullWidthCodePoint) {
    return false;
  }
  return isInRange(fullwidthRanges, codePoint);
}, isWide = (codePoint) => {
  if (codePoint >= wideFastPathStart && codePoint <= wideFastPathEnd) {
    return true;
  }
  if (codePoint < minimumWideCodePoint || codePoint > maximumWideCodePoint) {
    return false;
  }
  return isInRange(wideRanges, codePoint);
};
var init_lookup = __esm(() => {
  init_lookup_data();
  init_utilities();
  minimumAmbiguousCodePoint = ambiguousRanges[0];
  maximumAmbiguousCodePoint = ambiguousRanges.at(-1);
  minimumFullWidthCodePoint = fullwidthRanges[0];
  maximumFullWidthCodePoint = fullwidthRanges.at(-1);
  minimumHalfWidthCodePoint = halfwidthRanges[0];
  maximumHalfWidthCodePoint = halfwidthRanges.at(-1);
  minimumNarrowCodePoint = narrowRanges[0];
  maximumNarrowCodePoint = narrowRanges.at(-1);
  minimumWideCodePoint = wideRanges[0];
  maximumWideCodePoint = wideRanges.at(-1);
  [wideFastPathStart, wideFastPathEnd] = findWideFastPathRange(wideRanges);
});

// node_modules/.bun/get-east-asian-width@1.5.0/node_modules/get-east-asian-width/index.js
function validate(codePoint) {
  if (!Number.isSafeInteger(codePoint)) {
    throw new TypeError(`Expected a code point, got \`${typeof codePoint}\`.`);
  }
}
function eastAsianWidth(codePoint, { ambiguousAsWide = false } = {}) {
  validate(codePoint);
  if (isFullWidth(codePoint) || isWide(codePoint) || ambiguousAsWide && isAmbiguous(codePoint)) {
    return 2;
  }
  return 1;
}
var init_get_east_asian_width = __esm(() => {
  init_lookup();
  init_lookup();
});

// node_modules/.bun/ansi-regex@6.2.2/node_modules/ansi-regex/index.js
function ansiRegex({ onlyFirst = false } = {}) {
  const ST = "(?:\\u0007|\\u001B\\u005C|\\u009C)";
  const osc = `(?:\\u001B\\][\\s\\S]*?${ST})`;
  const csi = "[\\u001B\\u009B][[\\]()#;?]*(?:\\d{1,4}(?:[;:]\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]";
  const pattern = `${osc}|${csi}`;
  return new RegExp(pattern, onlyFirst ? undefined : "g");
}
var init_ansi_regex = () => {};

// node_modules/.bun/strip-ansi@7.2.0/node_modules/strip-ansi/index.js
function stripAnsi(string) {
  if (typeof string !== "string") {
    throw new TypeError(`Expected a \`string\`, got \`${typeof string}\``);
  }
  if (!string.includes("\x1B") && !string.includes("\x9B")) {
    return string;
  }
  return string.replace(regex, "");
}
var regex;
var init_strip_ansi = __esm(() => {
  init_ansi_regex();
  regex = ansiRegex();
});

// src/ink/stringWidth.ts
function stringWidthJavaScript(str) {
  if (typeof str !== "string" || str.length === 0) {
    return 0;
  }
  let isPureAscii = true;
  for (let i = 0;i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code >= 127 || code === 27) {
      isPureAscii = false;
      break;
    }
  }
  if (isPureAscii) {
    let width2 = 0;
    for (let i = 0;i < str.length; i++) {
      const code = str.charCodeAt(i);
      if (code > 31) {
        width2++;
      }
    }
    return width2;
  }
  if (str.includes("\x1B")) {
    str = stripAnsi(str);
    if (str.length === 0) {
      return 0;
    }
  }
  if (!needsSegmentation(str)) {
    let width2 = 0;
    for (const char of str) {
      const codePoint = char.codePointAt(0);
      if (!isZeroWidth(codePoint)) {
        width2 += eastAsianWidth(codePoint, { ambiguousAsWide: false });
      }
    }
    return width2;
  }
  let width = 0;
  for (const { segment: grapheme } of getGraphemeSegmenter().segment(str)) {
    EMOJI_REGEX.lastIndex = 0;
    if (EMOJI_REGEX.test(grapheme)) {
      width += getEmojiWidth(grapheme);
      continue;
    }
    for (const char of grapheme) {
      const codePoint = char.codePointAt(0);
      if (!isZeroWidth(codePoint)) {
        width += eastAsianWidth(codePoint, { ambiguousAsWide: false });
        break;
      }
    }
  }
  return width;
}
function needsSegmentation(str) {
  for (const char of str) {
    const cp = char.codePointAt(0);
    if (cp >= 127744 && cp <= 129791)
      return true;
    if (cp >= 9728 && cp <= 10175)
      return true;
    if (cp >= 127462 && cp <= 127487)
      return true;
    if (cp >= 65024 && cp <= 65039)
      return true;
    if (cp === 8205)
      return true;
  }
  return false;
}
function getEmojiWidth(grapheme) {
  const first = grapheme.codePointAt(0);
  if (first >= 127462 && first <= 127487) {
    let count = 0;
    for (const _ of grapheme)
      count++;
    return count === 1 ? 1 : 2;
  }
  if (grapheme.length === 2) {
    const second = grapheme.codePointAt(1);
    if (second === 65039 && (first >= 48 && first <= 57 || first === 35 || first === 42)) {
      return 1;
    }
  }
  return 2;
}
function isZeroWidth(codePoint) {
  if (codePoint >= 32 && codePoint < 127)
    return false;
  if (codePoint >= 160 && codePoint < 768)
    return codePoint === 173;
  if (codePoint <= 31 || codePoint >= 127 && codePoint <= 159)
    return true;
  if (codePoint >= 8203 && codePoint <= 8205 || codePoint === 65279 || codePoint >= 8288 && codePoint <= 8292) {
    return true;
  }
  if (codePoint >= 65024 && codePoint <= 65039 || codePoint >= 917760 && codePoint <= 917999) {
    return true;
  }
  if (codePoint >= 768 && codePoint <= 879 || codePoint >= 6832 && codePoint <= 6911 || codePoint >= 7616 && codePoint <= 7679 || codePoint >= 8400 && codePoint <= 8447 || codePoint >= 65056 && codePoint <= 65071) {
    return true;
  }
  if (codePoint >= 2304 && codePoint <= 3407) {
    const offset = codePoint & 127;
    if (offset <= 3)
      return true;
    if (offset >= 58 && offset <= 79)
      return true;
    if (offset >= 81 && offset <= 87)
      return true;
    if (offset >= 98 && offset <= 99)
      return true;
  }
  if (codePoint === 3633 || codePoint >= 3636 && codePoint <= 3642 || codePoint >= 3655 && codePoint <= 3662 || codePoint === 3761 || codePoint >= 3764 && codePoint <= 3772 || codePoint >= 3784 && codePoint <= 3789) {
    return true;
  }
  if (codePoint >= 1536 && codePoint <= 1541 || codePoint === 1757 || codePoint === 1807 || codePoint === 2274) {
    return true;
  }
  if (codePoint >= 55296 && codePoint <= 57343)
    return true;
  if (codePoint >= 917504 && codePoint <= 917631)
    return true;
  return false;
}
var EMOJI_REGEX, bunStringWidth, BUN_STRING_WIDTH_OPTS, stringWidth;
var init_stringWidth = __esm(() => {
  init_emoji_regex();
  init_get_east_asian_width();
  init_strip_ansi();
  init_intl();
  EMOJI_REGEX = emoji_regex_default();
  bunStringWidth = typeof Bun !== "undefined" && typeof Bun.stringWidth === "function" ? Bun.stringWidth : null;
  BUN_STRING_WIDTH_OPTS = { ambiguousIsNarrow: true };
  stringWidth = bunStringWidth ? (str) => bunStringWidth(str, BUN_STRING_WIDTH_OPTS) : stringWidthJavaScript;
});

// src/utils/truncate.ts
function truncatePathMiddle(path, maxLength) {
  if (stringWidth(path) <= maxLength) {
    return path;
  }
  if (maxLength <= 0) {
    return "\u2026";
  }
  if (maxLength < 5) {
    return truncateToWidth(path, maxLength);
  }
  const lastSlash = path.lastIndexOf("/");
  const filename = lastSlash >= 0 ? path.slice(lastSlash) : path;
  const directory = lastSlash >= 0 ? path.slice(0, lastSlash) : "";
  const filenameWidth = stringWidth(filename);
  if (filenameWidth >= maxLength - 1) {
    return truncateStartToWidth(path, maxLength);
  }
  const availableForDir = maxLength - 1 - filenameWidth;
  if (availableForDir <= 0) {
    return truncateStartToWidth(filename, maxLength);
  }
  const truncatedDir = truncateToWidthNoEllipsis(directory, availableForDir);
  return truncatedDir + "\u2026" + filename;
}
function truncateToWidth(text, maxWidth) {
  if (stringWidth(text) <= maxWidth)
    return text;
  if (maxWidth <= 1)
    return "\u2026";
  let width = 0;
  let result = "";
  for (const { segment } of getGraphemeSegmenter().segment(text)) {
    const segWidth = stringWidth(segment);
    if (width + segWidth > maxWidth - 1)
      break;
    result += segment;
    width += segWidth;
  }
  return result + "\u2026";
}
function truncateStartToWidth(text, maxWidth) {
  if (stringWidth(text) <= maxWidth)
    return text;
  if (maxWidth <= 1)
    return "\u2026";
  const segments = [...getGraphemeSegmenter().segment(text)];
  let width = 0;
  let startIdx = segments.length;
  for (let i = segments.length - 1;i >= 0; i--) {
    const segWidth = stringWidth(segments[i].segment);
    if (width + segWidth > maxWidth - 1)
      break;
    width += segWidth;
    startIdx = i;
  }
  return "\u2026" + segments.slice(startIdx).map((s) => s.segment).join("");
}
function truncateToWidthNoEllipsis(text, maxWidth) {
  if (stringWidth(text) <= maxWidth)
    return text;
  if (maxWidth <= 0)
    return "";
  let width = 0;
  let result = "";
  for (const { segment } of getGraphemeSegmenter().segment(text)) {
    const segWidth = stringWidth(segment);
    if (width + segWidth > maxWidth)
      break;
    result += segment;
    width += segWidth;
  }
  return result;
}
function truncate(str, maxWidth, singleLine = false) {
  let result = str;
  if (singleLine) {
    const firstNewline = str.indexOf(`
`);
    if (firstNewline !== -1) {
      result = str.substring(0, firstNewline);
      if (stringWidth(result) + 1 > maxWidth) {
        return truncateToWidth(result, maxWidth);
      }
      return `${result}\u2026`;
    }
  }
  if (stringWidth(result) <= maxWidth) {
    return result;
  }
  return truncateToWidth(result, maxWidth);
}
var init_truncate = __esm(() => {
  init_stringWidth();
  init_intl();
});

// src/utils/format.ts
function formatFileSize(sizeInBytes) {
  const kb = sizeInBytes / 1024;
  if (kb < 1) {
    return `${sizeInBytes} bytes`;
  }
  if (kb < 1024) {
    return `${kb.toFixed(1).replace(/\.0$/, "")}KB`;
  }
  const mb = kb / 1024;
  if (mb < 1024) {
    return `${mb.toFixed(1).replace(/\.0$/, "")}MB`;
  }
  const gb = mb / 1024;
  return `${gb.toFixed(1).replace(/\.0$/, "")}GB`;
}
function formatSecondsShort(ms) {
  return `${(ms / 1000).toFixed(1)}s`;
}
function formatDuration(ms, options) {
  if (ms < 60000) {
    if (ms === 0) {
      return "0s";
    }
    if (ms < 1) {
      const s2 = (ms / 1000).toFixed(1);
      return `${s2}s`;
    }
    const s = Math.floor(ms / 1000).toString();
    return `${s}s`;
  }
  let days = Math.floor(ms / 86400000);
  let hours = Math.floor(ms % 86400000 / 3600000);
  let minutes = Math.floor(ms % 3600000 / 60000);
  let seconds = Math.round(ms % 60000 / 1000);
  if (seconds === 60) {
    seconds = 0;
    minutes++;
  }
  if (minutes === 60) {
    minutes = 0;
    hours++;
  }
  if (hours === 24) {
    hours = 0;
    days++;
  }
  const hide = options?.hideTrailingZeros;
  if (options?.mostSignificantOnly) {
    if (days > 0)
      return `${days}d`;
    if (hours > 0)
      return `${hours}h`;
    if (minutes > 0)
      return `${minutes}m`;
    return `${seconds}s`;
  }
  if (days > 0) {
    if (hide && hours === 0 && minutes === 0)
      return `${days}d`;
    if (hide && minutes === 0)
      return `${days}d ${hours}h`;
    return `${days}d ${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    if (hide && minutes === 0 && seconds === 0)
      return `${hours}h`;
    if (hide && seconds === 0)
      return `${hours}h ${minutes}m`;
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    if (hide && seconds === 0)
      return `${minutes}m`;
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}
function formatNumber(number) {
  const shouldUseConsistentDecimals = number >= 1000;
  return getNumberFormatter(shouldUseConsistentDecimals).format(number).toLowerCase();
}
function formatTokens(count) {
  return formatNumber(count).replace(".0", "");
}
function formatRelativeTime(date, options = {}) {
  const { style = "narrow", numeric = "always", now = new Date } = options;
  const diffInMs = date.getTime() - now.getTime();
  const diffInSeconds = Math.trunc(diffInMs / 1000);
  const intervals = [
    { unit: "year", seconds: 31536000, shortUnit: "y" },
    { unit: "month", seconds: 2592000, shortUnit: "mo" },
    { unit: "week", seconds: 604800, shortUnit: "w" },
    { unit: "day", seconds: 86400, shortUnit: "d" },
    { unit: "hour", seconds: 3600, shortUnit: "h" },
    { unit: "minute", seconds: 60, shortUnit: "m" },
    { unit: "second", seconds: 1, shortUnit: "s" }
  ];
  for (const { unit, seconds: intervalSeconds, shortUnit } of intervals) {
    if (Math.abs(diffInSeconds) >= intervalSeconds) {
      const value = Math.trunc(diffInSeconds / intervalSeconds);
      if (style === "narrow") {
        return diffInSeconds < 0 ? `${Math.abs(value)}${shortUnit} ago` : `in ${value}${shortUnit}`;
      }
      return getRelativeTimeFormat("long", numeric).format(value, unit);
    }
  }
  if (style === "narrow") {
    return diffInSeconds <= 0 ? "0s ago" : "in 0s";
  }
  return getRelativeTimeFormat(style, numeric).format(0, "second");
}
function formatRelativeTimeAgo(date, options = {}) {
  const { now = new Date, ...restOptions } = options;
  if (date > now) {
    return formatRelativeTime(date, { ...restOptions, now });
  }
  return formatRelativeTime(date, { ...restOptions, numeric: "always", now });
}
function formatLogMetadata(log) {
  const sizeOrCount = log.fileSize !== undefined ? formatFileSize(log.fileSize) : `${log.messageCount} messages`;
  const parts = [
    formatRelativeTimeAgo(log.modified, { style: "short" }),
    ...log.gitBranch ? [log.gitBranch] : [],
    sizeOrCount
  ];
  if (log.tag) {
    parts.push(`#${log.tag}`);
  }
  if (log.agentSetting) {
    parts.push(`@${log.agentSetting}`);
  }
  if (log.prNumber) {
    parts.push(log.prRepository ? `${log.prRepository}#${log.prNumber}` : `#${log.prNumber}`);
  }
  return parts.join(" \xB7 ");
}
function formatResetTime(timestampInSeconds, showTimezone = false, showTime = true) {
  if (!timestampInSeconds)
    return;
  const date = new Date(timestampInSeconds * 1000);
  const now = new Date;
  const minutes = date.getMinutes();
  const hoursUntilReset = (date.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursUntilReset > 24) {
    const dateOptions = {
      month: "short",
      day: "numeric",
      hour: showTime ? "numeric" : undefined,
      minute: !showTime || minutes === 0 ? undefined : "2-digit",
      hour12: showTime ? true : undefined
    };
    if (date.getFullYear() !== now.getFullYear()) {
      dateOptions.year = "numeric";
    }
    const dateString = date.toLocaleString("en-US", dateOptions);
    return dateString.replace(/ ([AP]M)/i, (_match, ampm) => ampm.toLowerCase()) + (showTimezone ? ` (${getTimeZone()})` : "");
  }
  const timeString = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: minutes === 0 ? undefined : "2-digit",
    hour12: true
  });
  return timeString.replace(/ ([AP]M)/i, (_match, ampm) => ampm.toLowerCase()) + (showTimezone ? ` (${getTimeZone()})` : "");
}
function formatResetText(resetsAt, showTimezone = false, showTime = true) {
  const dt = new Date(resetsAt);
  return `${formatResetTime(Math.floor(dt.getTime() / 1000), showTimezone, showTime)}`;
}
var numberFormatterForConsistentDecimals = null, numberFormatterForInconsistentDecimals = null, getNumberFormatter = (useConsistentDecimals) => {
  if (useConsistentDecimals) {
    if (!numberFormatterForConsistentDecimals) {
      numberFormatterForConsistentDecimals = new Intl.NumberFormat("en-US", {
        notation: "compact",
        maximumFractionDigits: 1,
        minimumFractionDigits: 1
      });
    }
    return numberFormatterForConsistentDecimals;
  } else {
    if (!numberFormatterForInconsistentDecimals) {
      numberFormatterForInconsistentDecimals = new Intl.NumberFormat("en-US", {
        notation: "compact",
        maximumFractionDigits: 1,
        minimumFractionDigits: 0
      });
    }
    return numberFormatterForInconsistentDecimals;
  }
};
var init_format = __esm(() => {
  init_intl();
  init_truncate();
});

// src/utils/profilerBase.ts
function getPerformance() {
  if (!performance) {
    performance = __require("perf_hooks").performance;
  }
  return performance;
}
function formatMs(ms) {
  return ms.toFixed(3);
}
function formatTimelineLine(totalMs, deltaMs, name, memory, totalPad, deltaPad, extra = "") {
  const memInfo = memory ? ` | RSS: ${formatFileSize(memory.rss)}, Heap: ${formatFileSize(memory.heapUsed)}` : "";
  return `[+${formatMs(totalMs).padStart(totalPad)}ms] (+${formatMs(deltaMs).padStart(deltaPad)}ms) ${name}${extra}${memInfo}`;
}
var performance = null;
var init_profilerBase = __esm(() => {
  init_format();
});

// src/utils/startupProfiler.ts
import { dirname, join } from "path";
function profileCheckpoint(name) {
  if (!SHOULD_PROFILE)
    return;
  const perf = getPerformance();
  perf.mark(name);
  if (DETAILED_PROFILING) {
    memorySnapshots.push(process.memoryUsage());
  }
}
function getReport() {
  if (!DETAILED_PROFILING) {
    return "Startup profiling not enabled";
  }
  const perf = getPerformance();
  const marks = perf.getEntriesByType("mark");
  if (marks.length === 0) {
    return "No profiling checkpoints recorded";
  }
  const lines = [];
  lines.push("=".repeat(80));
  lines.push("STARTUP PROFILING REPORT");
  lines.push("=".repeat(80));
  lines.push("");
  let prevTime = 0;
  for (const [i, mark] of marks.entries()) {
    lines.push(formatTimelineLine(mark.startTime, mark.startTime - prevTime, mark.name, memorySnapshots[i], 8, 7));
    prevTime = mark.startTime;
  }
  const lastMark = marks[marks.length - 1];
  lines.push("");
  lines.push(`Total startup time: ${formatMs(lastMark?.startTime ?? 0)}ms`);
  lines.push("=".repeat(80));
  return lines.join(`
`);
}
function profileReport() {
  if (reported)
    return;
  reported = true;
  logStartupPerf();
  if (DETAILED_PROFILING) {
    const path = getStartupPerfLogPath();
    const dir = dirname(path);
    const fs = getFsImplementation();
    fs.mkdirSync(dir);
    writeFileSync_DEPRECATED(path, getReport(), {
      encoding: "utf8",
      flush: true
    });
    logForDebugging("Startup profiling report:");
    logForDebugging(getReport());
  }
}
function isDetailedProfilingEnabled() {
  return DETAILED_PROFILING;
}
function getStartupPerfLogPath() {
  return join(getClaudeConfigHomeDir(), "startup-perf", `${getSessionId()}.txt`);
}
function logStartupPerf() {
  if (!STATSIG_LOGGING_SAMPLED)
    return;
  const perf = getPerformance();
  const marks = perf.getEntriesByType("mark");
  if (marks.length === 0)
    return;
  const checkpointTimes = new Map;
  for (const mark of marks) {
    checkpointTimes.set(mark.name, mark.startTime);
  }
  const metadata = {};
  for (const [phaseName, [startCheckpoint, endCheckpoint]] of Object.entries(PHASE_DEFINITIONS)) {
    const startTime = checkpointTimes.get(startCheckpoint);
    const endTime = checkpointTimes.get(endCheckpoint);
    if (startTime !== undefined && endTime !== undefined) {
      metadata[`${phaseName}_ms`] = Math.round(endTime - startTime);
    }
  }
  metadata.checkpoint_count = marks.length;
  logEvent("tengu_startup_perf", metadata);
}
var DETAILED_PROFILING, STATSIG_SAMPLE_RATE = 0.005, STATSIG_LOGGING_SAMPLED, SHOULD_PROFILE, memorySnapshots, PHASE_DEFINITIONS, reported = false;
var init_startupProfiler = __esm(() => {
  init_state();
  init_analytics();
  init_debug();
  init_envUtils();
  init_fsOperations();
  init_profilerBase();
  init_slowOperations();
  DETAILED_PROFILING = isEnvTruthy(process.env.CLAUDE_CODE_PROFILE_STARTUP);
  STATSIG_LOGGING_SAMPLED = process.env.USER_TYPE === "ant" || Math.random() < STATSIG_SAMPLE_RATE;
  SHOULD_PROFILE = DETAILED_PROFILING || STATSIG_LOGGING_SAMPLED;
  memorySnapshots = [];
  PHASE_DEFINITIONS = {
    import_time: ["cli_entry", "main_tsx_imports_loaded"],
    init_time: ["init_function_start", "init_function_end"],
    settings_time: ["eagerLoadSettings_start", "eagerLoadSettings_end"],
    total_time: ["cli_entry", "main_after_run"]
  };
  if (SHOULD_PROFILE) {
    profileCheckpoint("profiler_initialized");
  }
});

export { isFullWidth, isWide, eastAsianWidth, init_get_east_asian_width, stripAnsi, init_strip_ansi, stringWidth, init_stringWidth, truncatePathMiddle, truncateToWidth, truncateStartToWidth, truncateToWidthNoEllipsis, truncate, init_truncate, formatFileSize, formatSecondsShort, formatDuration, formatNumber, formatTokens, formatRelativeTime, formatRelativeTimeAgo, formatLogMetadata, formatResetTime, formatResetText, init_format, getPerformance, formatMs, formatTimelineLine, init_profilerBase, profileCheckpoint, profileReport, isDetailedProfilingEnabled, getStartupPerfLogPath, logStartupPerf, init_startupProfiler };
