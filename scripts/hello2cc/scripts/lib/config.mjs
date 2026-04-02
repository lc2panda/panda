export const FORCED_OUTPUT_STYLE_NAME = 'hello2cc:hello2cc Native';

export function envValue(name) {
  return String(process.env[name] || '').trim();
}

export function pluginOption(key) {
  return envValue(`CLAUDE_PLUGIN_OPTION_${key.toUpperCase()}`);
}

export function configuredPolicy() {
  return pluginOption('routing_policy') || 'native-inject';
}

export function configuredMirrorSessionModel() {
  return pluginOption('mirror_session_model') !== 'false';
}

function mirroredSessionModel(sessionContext) {
  if (!configuredMirrorSessionModel()) return '';

  return String(
    sessionContext?.mainModel ||
    sessionContext?.model ||
    '',
  ).trim();
}

export function configuredModels(sessionContext = {}) {
  const sessionModel = mirroredSessionModel(sessionContext);
  const primaryModelOption = pluginOption('primary_model');
  const subagentModelOption = pluginOption('subagent_model');
  const guideModelOption = pluginOption('guide_model');
  const exploreModelOption = pluginOption('explore_model');
  const planModelOption = pluginOption('plan_model');
  const generalModelOption = pluginOption('general_model');
  const teamModelOption = pluginOption('team_model');

  const primaryModel = primaryModelOption || sessionModel || '';
  const subagentFallback = envValue('CLAUDE_CODE_SUBAGENT_MODEL');
  const subagentModel = subagentModelOption || subagentFallback || sessionModel || primaryModel || '';
  const guideModel = guideModelOption || sessionModel || primaryModel || '';
  const exploreModel = exploreModelOption || sessionModel || subagentModel || primaryModel || '';
  const planModel = planModelOption || primaryModel || sessionModel || subagentModel || '';
  const generalModel = generalModelOption || primaryModel || subagentModel || sessionModel || '';
  const teamModel = teamModelOption || subagentModel || generalModel || primaryModel || sessionModel || '';

  return {
    routingPolicy: configuredPolicy(),
    mirrorSessionModel: configuredMirrorSessionModel(),
    sessionModel,
    primaryModel,
    subagentModel,
    guideModel,
    exploreModel,
    planModel,
    generalModel,
    teamModel,
    explicitPrimaryModel: Boolean(primaryModelOption),
    explicitSubagentModel: Boolean(subagentModelOption || subagentFallback),
    explicitGuideModel: Boolean(guideModelOption),
    explicitExploreModel: Boolean(exploreModelOption),
    explicitPlanModel: Boolean(planModelOption),
    explicitGeneralModel: Boolean(generalModelOption),
    explicitTeamModel: Boolean(teamModelOption),
  };
}
