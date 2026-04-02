// @bun
import {
  fromSso,
  init_dist_es
} from "./chunk-qj8aff56.js";
import {
  require_dist_cjs as require_dist_cjs2
} from "./chunk-n0qaeaa5.js";
import {
  require_client
} from "./chunk-b4wg70y1.js";
import {
  require_dist_cjs
} from "./chunk-hk9xz7gk.js";
import {
  __esm,
  __require,
  __toESM
} from "./chunk-qp2qdcda.js";

// node_modules/.bun/@aws-sdk+credential-provider-sso@3.972.27/node_modules/@aws-sdk/credential-provider-sso/dist-es/isSsoProfile.js
var isSsoProfile = (arg) => arg && (typeof arg.sso_start_url === "string" || typeof arg.sso_account_id === "string" || typeof arg.sso_session === "string" || typeof arg.sso_region === "string" || typeof arg.sso_role_name === "string");
var init_isSsoProfile = () => {};

// node_modules/.bun/@aws-sdk+credential-provider-sso@3.972.27/node_modules/@aws-sdk/credential-provider-sso/dist-es/resolveSSOCredentials.js
var import_client, import_property_provider, import_shared_ini_file_loader, SHOULD_FAIL_CREDENTIAL_CHAIN = false, resolveSSOCredentials = async ({ ssoStartUrl, ssoSession, ssoAccountId, ssoRegion, ssoRoleName, ssoClient, clientConfig, parentClientConfig, callerClientConfig, profile, filepath, configFilepath, ignoreCache, logger }) => {
  let token;
  const refreshMessage = `To refresh this SSO session run aws sso login with the corresponding profile.`;
  if (ssoSession) {
    try {
      const _token = await fromSso({
        profile,
        filepath,
        configFilepath,
        ignoreCache
      })();
      token = {
        accessToken: _token.token,
        expiresAt: new Date(_token.expiration).toISOString()
      };
    } catch (e) {
      throw new import_property_provider.CredentialsProviderError(e.message, {
        tryNextLink: SHOULD_FAIL_CREDENTIAL_CHAIN,
        logger
      });
    }
  } else {
    try {
      token = await import_shared_ini_file_loader.getSSOTokenFromFile(ssoStartUrl);
    } catch (e) {
      throw new import_property_provider.CredentialsProviderError(`The SSO session associated with this profile is invalid. ${refreshMessage}`, {
        tryNextLink: SHOULD_FAIL_CREDENTIAL_CHAIN,
        logger
      });
    }
  }
  if (new Date(token.expiresAt).getTime() - Date.now() <= 0) {
    throw new import_property_provider.CredentialsProviderError(`The SSO session associated with this profile has expired. ${refreshMessage}`, {
      tryNextLink: SHOULD_FAIL_CREDENTIAL_CHAIN,
      logger
    });
  }
  const { accessToken } = token;
  const { SSOClient, GetRoleCredentialsCommand } = await import("./chunk-genng9sj.js");
  const sso = ssoClient || new SSOClient(Object.assign({}, clientConfig ?? {}, {
    logger: clientConfig?.logger ?? callerClientConfig?.logger ?? parentClientConfig?.logger,
    region: clientConfig?.region ?? ssoRegion,
    userAgentAppId: clientConfig?.userAgentAppId ?? callerClientConfig?.userAgentAppId ?? parentClientConfig?.userAgentAppId
  }));
  let ssoResp;
  try {
    ssoResp = await sso.send(new GetRoleCredentialsCommand({
      accountId: ssoAccountId,
      roleName: ssoRoleName,
      accessToken
    }));
  } catch (e) {
    throw new import_property_provider.CredentialsProviderError(e, {
      tryNextLink: SHOULD_FAIL_CREDENTIAL_CHAIN,
      logger
    });
  }
  const { roleCredentials: { accessKeyId, secretAccessKey, sessionToken, expiration, credentialScope, accountId } = {} } = ssoResp;
  if (!accessKeyId || !secretAccessKey || !sessionToken || !expiration) {
    throw new import_property_provider.CredentialsProviderError("SSO returns an invalid temporary credential.", {
      tryNextLink: SHOULD_FAIL_CREDENTIAL_CHAIN,
      logger
    });
  }
  const credentials = {
    accessKeyId,
    secretAccessKey,
    sessionToken,
    expiration: new Date(expiration),
    ...credentialScope && { credentialScope },
    ...accountId && { accountId }
  };
  if (ssoSession) {
    import_client.setCredentialFeature(credentials, "CREDENTIALS_SSO", "s");
  } else {
    import_client.setCredentialFeature(credentials, "CREDENTIALS_SSO_LEGACY", "u");
  }
  return credentials;
};
var init_resolveSSOCredentials = __esm(() => {
  init_dist_es();
  import_client = __toESM(require_client(), 1);
  import_property_provider = __toESM(require_dist_cjs(), 1);
  import_shared_ini_file_loader = __toESM(require_dist_cjs2(), 1);
});

// node_modules/.bun/@aws-sdk+credential-provider-sso@3.972.27/node_modules/@aws-sdk/credential-provider-sso/dist-es/validateSsoProfile.js
var import_property_provider2, validateSsoProfile = (profile, logger) => {
  const { sso_start_url, sso_account_id, sso_region, sso_role_name } = profile;
  if (!sso_start_url || !sso_account_id || !sso_region || !sso_role_name) {
    throw new import_property_provider2.CredentialsProviderError(`Profile is configured with invalid SSO credentials. Required parameters "sso_account_id", ` + `"sso_region", "sso_role_name", "sso_start_url". Got ${Object.keys(profile).join(", ")}
Reference: https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso.html`, { tryNextLink: false, logger });
  }
  return profile;
};
var init_validateSsoProfile = __esm(() => {
  import_property_provider2 = __toESM(require_dist_cjs(), 1);
});

// node_modules/.bun/@aws-sdk+credential-provider-sso@3.972.27/node_modules/@aws-sdk/credential-provider-sso/dist-es/fromSSO.js
var import_property_provider3, import_shared_ini_file_loader2, fromSSO = (init = {}) => async ({ callerClientConfig } = {}) => {
  init.logger?.debug("@aws-sdk/credential-provider-sso - fromSSO");
  const { ssoStartUrl, ssoAccountId, ssoRegion, ssoRoleName, ssoSession } = init;
  const { ssoClient } = init;
  const profileName = import_shared_ini_file_loader2.getProfileName({
    profile: init.profile ?? callerClientConfig?.profile
  });
  if (!ssoStartUrl && !ssoAccountId && !ssoRegion && !ssoRoleName && !ssoSession) {
    const profiles = await import_shared_ini_file_loader2.parseKnownFiles(init);
    const profile = profiles[profileName];
    if (!profile) {
      throw new import_property_provider3.CredentialsProviderError(`Profile ${profileName} was not found.`, { logger: init.logger });
    }
    if (!isSsoProfile(profile)) {
      throw new import_property_provider3.CredentialsProviderError(`Profile ${profileName} is not configured with SSO credentials.`, {
        logger: init.logger
      });
    }
    if (profile?.sso_session) {
      const ssoSessions = await import_shared_ini_file_loader2.loadSsoSessionData(init);
      const session = ssoSessions[profile.sso_session];
      const conflictMsg = ` configurations in profile ${profileName} and sso-session ${profile.sso_session}`;
      if (ssoRegion && ssoRegion !== session.sso_region) {
        throw new import_property_provider3.CredentialsProviderError(`Conflicting SSO region` + conflictMsg, {
          tryNextLink: false,
          logger: init.logger
        });
      }
      if (ssoStartUrl && ssoStartUrl !== session.sso_start_url) {
        throw new import_property_provider3.CredentialsProviderError(`Conflicting SSO start_url` + conflictMsg, {
          tryNextLink: false,
          logger: init.logger
        });
      }
      profile.sso_region = session.sso_region;
      profile.sso_start_url = session.sso_start_url;
    }
    const { sso_start_url, sso_account_id, sso_region, sso_role_name, sso_session } = validateSsoProfile(profile, init.logger);
    return resolveSSOCredentials({
      ssoStartUrl: sso_start_url,
      ssoSession: sso_session,
      ssoAccountId: sso_account_id,
      ssoRegion: sso_region,
      ssoRoleName: sso_role_name,
      ssoClient,
      clientConfig: init.clientConfig,
      parentClientConfig: init.parentClientConfig,
      callerClientConfig: init.callerClientConfig,
      profile: profileName,
      filepath: init.filepath,
      configFilepath: init.configFilepath,
      ignoreCache: init.ignoreCache,
      logger: init.logger
    });
  } else if (!ssoStartUrl || !ssoAccountId || !ssoRegion || !ssoRoleName) {
    throw new import_property_provider3.CredentialsProviderError("Incomplete configuration. The fromSSO() argument hash must include " + '"ssoStartUrl", "ssoAccountId", "ssoRegion", "ssoRoleName"', { tryNextLink: false, logger: init.logger });
  } else {
    return resolveSSOCredentials({
      ssoStartUrl,
      ssoSession,
      ssoAccountId,
      ssoRegion,
      ssoRoleName,
      ssoClient,
      clientConfig: init.clientConfig,
      parentClientConfig: init.parentClientConfig,
      callerClientConfig: init.callerClientConfig,
      profile: profileName,
      filepath: init.filepath,
      configFilepath: init.configFilepath,
      ignoreCache: init.ignoreCache,
      logger: init.logger
    });
  }
};
var init_fromSSO = __esm(() => {
  init_isSsoProfile();
  init_resolveSSOCredentials();
  init_validateSsoProfile();
  import_property_provider3 = __toESM(require_dist_cjs(), 1);
  import_shared_ini_file_loader2 = __toESM(require_dist_cjs2(), 1);
});

// node_modules/.bun/@aws-sdk+credential-provider-sso@3.972.27/node_modules/@aws-sdk/credential-provider-sso/dist-es/types.js
var init_types = () => {};

// node_modules/.bun/@aws-sdk+credential-provider-sso@3.972.27/node_modules/@aws-sdk/credential-provider-sso/dist-es/index.js
var init_dist_es2 = __esm(() => {
  init_fromSSO();
  init_isSsoProfile();
  init_types();
  init_validateSsoProfile();
});

export { isSsoProfile, validateSsoProfile, fromSSO, init_dist_es2 as init_dist_es };
