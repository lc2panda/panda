// @bun
import {
  require_dist_cjs4 as require_dist_cjs3,
  require_protocols
} from "./chunk-wfz0qffj.js";
import {
  require_dist_cjs as require_dist_cjs2
} from "./chunk-30rst83v.js";
import {
  require_dist_cjs
} from "./chunk-xsq9ae7x.js";
import {
  __commonJS
} from "./chunk-qp2qdcda.js";

// node_modules/.bun/@smithy+core@3.23.13/node_modules/@smithy/core/dist-cjs/index.js
var require_dist_cjs4 = __commonJS((exports) => {
  var types = require_dist_cjs();
  var utilMiddleware = require_dist_cjs3();
  var protocolHttp = require_dist_cjs2();
  var protocols = require_protocols();
  var getSmithyContext = (context) => context[types.SMITHY_CONTEXT_KEY] || (context[types.SMITHY_CONTEXT_KEY] = {});
  var resolveAuthOptions = (candidateAuthOptions, authSchemePreference) => {
    if (!authSchemePreference || authSchemePreference.length === 0) {
      return candidateAuthOptions;
    }
    const preferredAuthOptions = [];
    for (const preferredSchemeName of authSchemePreference) {
      for (const candidateAuthOption of candidateAuthOptions) {
        const candidateAuthSchemeName = candidateAuthOption.schemeId.split("#")[1];
        if (candidateAuthSchemeName === preferredSchemeName) {
          preferredAuthOptions.push(candidateAuthOption);
        }
      }
    }
    for (const candidateAuthOption of candidateAuthOptions) {
      if (!preferredAuthOptions.find(({ schemeId }) => schemeId === candidateAuthOption.schemeId)) {
        preferredAuthOptions.push(candidateAuthOption);
      }
    }
    return preferredAuthOptions;
  };
  function convertHttpAuthSchemesToMap(httpAuthSchemes) {
    const map = new Map;
    for (const scheme of httpAuthSchemes) {
      map.set(scheme.schemeId, scheme);
    }
    return map;
  }
  var httpAuthSchemeMiddleware = (config, mwOptions) => (next, context) => async (args) => {
    const options = config.httpAuthSchemeProvider(await mwOptions.httpAuthSchemeParametersProvider(config, context, args.input));
    const authSchemePreference = config.authSchemePreference ? await config.authSchemePreference() : [];
    const resolvedOptions = resolveAuthOptions(options, authSchemePreference);
    const authSchemes = convertHttpAuthSchemesToMap(config.httpAuthSchemes);
    const smithyContext = utilMiddleware.getSmithyContext(context);
    const failureReasons = [];
    for (const option of resolvedOptions) {
      const scheme = authSchemes.get(option.schemeId);
      if (!scheme) {
        failureReasons.push(`HttpAuthScheme \`${option.schemeId}\` was not enabled for this service.`);
        continue;
      }
      const identityProvider = scheme.identityProvider(await mwOptions.identityProviderConfigProvider(config));
      if (!identityProvider) {
        failureReasons.push(`HttpAuthScheme \`${option.schemeId}\` did not have an IdentityProvider configured.`);
        continue;
      }
      const { identityProperties = {}, signingProperties = {} } = option.propertiesExtractor?.(config, context) || {};
      option.identityProperties = Object.assign(option.identityProperties || {}, identityProperties);
      option.signingProperties = Object.assign(option.signingProperties || {}, signingProperties);
      smithyContext.selectedHttpAuthScheme = {
        httpAuthOption: option,
        identity: await identityProvider(option.identityProperties),
        signer: scheme.signer
      };
      break;
    }
    if (!smithyContext.selectedHttpAuthScheme) {
      throw new Error(failureReasons.join(`
`));
    }
    return next(args);
  };
  var httpAuthSchemeEndpointRuleSetMiddlewareOptions = {
    step: "serialize",
    tags: ["HTTP_AUTH_SCHEME"],
    name: "httpAuthSchemeMiddleware",
    override: true,
    relation: "before",
    toMiddleware: "endpointV2Middleware"
  };
  var getHttpAuthSchemeEndpointRuleSetPlugin = (config, { httpAuthSchemeParametersProvider, identityProviderConfigProvider }) => ({
    applyToStack: (clientStack) => {
      clientStack.addRelativeTo(httpAuthSchemeMiddleware(config, {
        httpAuthSchemeParametersProvider,
        identityProviderConfigProvider
      }), httpAuthSchemeEndpointRuleSetMiddlewareOptions);
    }
  });
  var httpAuthSchemeMiddlewareOptions = {
    step: "serialize",
    tags: ["HTTP_AUTH_SCHEME"],
    name: "httpAuthSchemeMiddleware",
    override: true,
    relation: "before",
    toMiddleware: "serializerMiddleware"
  };
  var getHttpAuthSchemePlugin = (config, { httpAuthSchemeParametersProvider, identityProviderConfigProvider }) => ({
    applyToStack: (clientStack) => {
      clientStack.addRelativeTo(httpAuthSchemeMiddleware(config, {
        httpAuthSchemeParametersProvider,
        identityProviderConfigProvider
      }), httpAuthSchemeMiddlewareOptions);
    }
  });
  var defaultErrorHandler = (signingProperties) => (error) => {
    throw error;
  };
  var defaultSuccessHandler = (httpResponse, signingProperties) => {};
  var httpSigningMiddleware = (config) => (next, context) => async (args) => {
    if (!protocolHttp.HttpRequest.isInstance(args.request)) {
      return next(args);
    }
    const smithyContext = utilMiddleware.getSmithyContext(context);
    const scheme = smithyContext.selectedHttpAuthScheme;
    if (!scheme) {
      throw new Error(`No HttpAuthScheme was selected: unable to sign request`);
    }
    const { httpAuthOption: { signingProperties = {} }, identity, signer } = scheme;
    const output = await next({
      ...args,
      request: await signer.sign(args.request, identity, signingProperties)
    }).catch((signer.errorHandler || defaultErrorHandler)(signingProperties));
    (signer.successHandler || defaultSuccessHandler)(output.response, signingProperties);
    return output;
  };
  var httpSigningMiddlewareOptions = {
    step: "finalizeRequest",
    tags: ["HTTP_SIGNING"],
    name: "httpSigningMiddleware",
    aliases: ["apiKeyMiddleware", "tokenMiddleware", "awsAuthMiddleware"],
    override: true,
    relation: "after",
    toMiddleware: "retryMiddleware"
  };
  var getHttpSigningPlugin = (config) => ({
    applyToStack: (clientStack) => {
      clientStack.addRelativeTo(httpSigningMiddleware(), httpSigningMiddlewareOptions);
    }
  });
  var normalizeProvider = (input) => {
    if (typeof input === "function")
      return input;
    const promisified = Promise.resolve(input);
    return () => promisified;
  };
  var makePagedClientRequest = async (CommandCtor, client, input, withCommand = (_) => _, ...args) => {
    let command = new CommandCtor(input);
    command = withCommand(command) ?? command;
    return await client.send(command, ...args);
  };
  function createPaginator(ClientCtor, CommandCtor, inputTokenName, outputTokenName, pageSizeTokenName) {
    return async function* paginateOperation(config, input, ...additionalArguments) {
      const _input = input;
      let token = config.startingToken ?? _input[inputTokenName];
      let hasNext = true;
      let page;
      while (hasNext) {
        _input[inputTokenName] = token;
        if (pageSizeTokenName) {
          _input[pageSizeTokenName] = _input[pageSizeTokenName] ?? config.pageSize;
        }
        if (config.client instanceof ClientCtor) {
          page = await makePagedClientRequest(CommandCtor, config.client, input, config.withCommand, ...additionalArguments);
        } else {
          throw new Error(`Invalid client, expected instance of ${ClientCtor.name}`);
        }
        yield page;
        const prevToken = token;
        token = get(page, outputTokenName);
        hasNext = !!(token && (!config.stopOnSameToken || token !== prevToken));
      }
      return;
    };
  }
  var get = (fromObject, path) => {
    let cursor = fromObject;
    const pathComponents = path.split(".");
    for (const step of pathComponents) {
      if (!cursor || typeof cursor !== "object") {
        return;
      }
      cursor = cursor[step];
    }
    return cursor;
  };
  function setFeature(context, feature, value) {
    if (!context.__smithy_context) {
      context.__smithy_context = {
        features: {}
      };
    } else if (!context.__smithy_context.features) {
      context.__smithy_context.features = {};
    }
    context.__smithy_context.features[feature] = value;
  }

  class DefaultIdentityProviderConfig {
    authSchemes = new Map;
    constructor(config) {
      for (const [key, value] of Object.entries(config)) {
        if (value !== undefined) {
          this.authSchemes.set(key, value);
        }
      }
    }
    getIdentityProvider(schemeId) {
      return this.authSchemes.get(schemeId);
    }
  }

  class HttpApiKeyAuthSigner {
    async sign(httpRequest, identity, signingProperties) {
      if (!signingProperties) {
        throw new Error("request could not be signed with `apiKey` since the `name` and `in` signer properties are missing");
      }
      if (!signingProperties.name) {
        throw new Error("request could not be signed with `apiKey` since the `name` signer property is missing");
      }
      if (!signingProperties.in) {
        throw new Error("request could not be signed with `apiKey` since the `in` signer property is missing");
      }
      if (!identity.apiKey) {
        throw new Error("request could not be signed with `apiKey` since the `apiKey` is not defined");
      }
      const clonedRequest = protocolHttp.HttpRequest.clone(httpRequest);
      if (signingProperties.in === types.HttpApiKeyAuthLocation.QUERY) {
        clonedRequest.query[signingProperties.name] = identity.apiKey;
      } else if (signingProperties.in === types.HttpApiKeyAuthLocation.HEADER) {
        clonedRequest.headers[signingProperties.name] = signingProperties.scheme ? `${signingProperties.scheme} ${identity.apiKey}` : identity.apiKey;
      } else {
        throw new Error("request can only be signed with `apiKey` locations `query` or `header`, " + "but found: `" + signingProperties.in + "`");
      }
      return clonedRequest;
    }
  }

  class HttpBearerAuthSigner {
    async sign(httpRequest, identity, signingProperties) {
      const clonedRequest = protocolHttp.HttpRequest.clone(httpRequest);
      if (!identity.token) {
        throw new Error("request could not be signed with `token` since the `token` is not defined");
      }
      clonedRequest.headers["Authorization"] = `Bearer ${identity.token}`;
      return clonedRequest;
    }
  }

  class NoAuthSigner {
    async sign(httpRequest, identity, signingProperties) {
      return httpRequest;
    }
  }
  var createIsIdentityExpiredFunction = (expirationMs) => function isIdentityExpired2(identity) {
    return doesIdentityRequireRefresh(identity) && identity.expiration.getTime() - Date.now() < expirationMs;
  };
  var EXPIRATION_MS = 300000;
  var isIdentityExpired = createIsIdentityExpiredFunction(EXPIRATION_MS);
  var doesIdentityRequireRefresh = (identity) => identity.expiration !== undefined;
  var memoizeIdentityProvider = (provider, isExpired, requiresRefresh) => {
    if (provider === undefined) {
      return;
    }
    const normalizedProvider = typeof provider !== "function" ? async () => Promise.resolve(provider) : provider;
    let resolved;
    let pending;
    let hasResult;
    let isConstant = false;
    const coalesceProvider = async (options) => {
      if (!pending) {
        pending = normalizedProvider(options);
      }
      try {
        resolved = await pending;
        hasResult = true;
        isConstant = false;
      } finally {
        pending = undefined;
      }
      return resolved;
    };
    if (isExpired === undefined) {
      return async (options) => {
        if (!hasResult || options?.forceRefresh) {
          resolved = await coalesceProvider(options);
        }
        return resolved;
      };
    }
    return async (options) => {
      if (!hasResult || options?.forceRefresh) {
        resolved = await coalesceProvider(options);
      }
      if (isConstant) {
        return resolved;
      }
      if (!requiresRefresh(resolved)) {
        isConstant = true;
        return resolved;
      }
      if (isExpired(resolved)) {
        await coalesceProvider(options);
        return resolved;
      }
      return resolved;
    };
  };
  exports.requestBuilder = protocols.requestBuilder;
  exports.DefaultIdentityProviderConfig = DefaultIdentityProviderConfig;
  exports.EXPIRATION_MS = EXPIRATION_MS;
  exports.HttpApiKeyAuthSigner = HttpApiKeyAuthSigner;
  exports.HttpBearerAuthSigner = HttpBearerAuthSigner;
  exports.NoAuthSigner = NoAuthSigner;
  exports.createIsIdentityExpiredFunction = createIsIdentityExpiredFunction;
  exports.createPaginator = createPaginator;
  exports.doesIdentityRequireRefresh = doesIdentityRequireRefresh;
  exports.getHttpAuthSchemeEndpointRuleSetPlugin = getHttpAuthSchemeEndpointRuleSetPlugin;
  exports.getHttpAuthSchemePlugin = getHttpAuthSchemePlugin;
  exports.getHttpSigningPlugin = getHttpSigningPlugin;
  exports.getSmithyContext = getSmithyContext;
  exports.httpAuthSchemeEndpointRuleSetMiddlewareOptions = httpAuthSchemeEndpointRuleSetMiddlewareOptions;
  exports.httpAuthSchemeMiddleware = httpAuthSchemeMiddleware;
  exports.httpAuthSchemeMiddlewareOptions = httpAuthSchemeMiddlewareOptions;
  exports.httpSigningMiddleware = httpSigningMiddleware;
  exports.httpSigningMiddlewareOptions = httpSigningMiddlewareOptions;
  exports.isIdentityExpired = isIdentityExpired;
  exports.memoizeIdentityProvider = memoizeIdentityProvider;
  exports.normalizeProvider = normalizeProvider;
  exports.setFeature = setFeature;
});

export { require_dist_cjs4 as require_dist_cjs };
