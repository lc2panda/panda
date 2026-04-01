// @bun
import {
  require_package
} from "./chunk-h0qngp9w.js";
import {
  require_dist_cjs as require_dist_cjs10,
  require_dist_cjs1 as require_dist_cjs11,
  require_dist_cjs10 as require_dist_cjs22,
  require_dist_cjs11 as require_dist_cjs23,
  require_dist_cjs12 as require_dist_cjs24,
  require_dist_cjs13 as require_dist_cjs25,
  require_dist_cjs2 as require_dist_cjs12,
  require_dist_cjs3 as require_dist_cjs14,
  require_dist_cjs4 as require_dist_cjs15,
  require_dist_cjs5 as require_dist_cjs16,
  require_dist_cjs6 as require_dist_cjs18,
  require_dist_cjs7 as require_dist_cjs19,
  require_dist_cjs8 as require_dist_cjs20,
  require_dist_cjs9 as require_dist_cjs21,
  require_protocols
} from "./chunk-ffhbe1z9.js";
import {
  require_dist_cjs as require_dist_cjs13,
  require_dist_cjs2 as require_dist_cjs17
} from "./chunk-n7ttdtk0.js";
import {
  require_httpAuthSchemes
} from "./chunk-wzpdet3m.js";
import {
  require_dist_cjs as require_dist_cjs9
} from "./chunk-p2d5nh3g.js";
import {
  require_dist_cjs as require_dist_cjs3
} from "./chunk-jzmz18nn.js";
import"./chunk-n0qaeaa5.js";
import {
  require_dist_cjs as require_dist_cjs8
} from "./chunk-2k995y2x.js";
import {
  require_dist_cjs as require_dist_cjs6,
  require_dist_cjs4 as require_dist_cjs7,
  require_schema,
  require_tslib
} from "./chunk-wfz0qffj.js";
import {
  require_client
} from "./chunk-b4wg70y1.js";
import {
  require_dist_cjs2
} from "./chunk-nka1g8f4.js";
import {
  require_dist_cjs
} from "./chunk-30rst83v.js";
import {
  require_dist_cjs as require_dist_cjs4
} from "./chunk-j2k4p94p.js";
import"./chunk-hk9xz7gk.js";
import"./chunk-xsq9ae7x.js";
import {
  require_dist_cjs2 as require_dist_cjs5
} from "./chunk-2nayx6q1.js";
import {
  __commonJS,
  __esm,
  __toESM
} from "./chunk-qp2qdcda.js";

// node_modules/.bun/@aws-sdk+nested-clients@3.996.17/node_modules/@aws-sdk/nested-clients/dist-cjs/submodules/sso/auth/httpAuthSchemeProvider.js
var require_httpAuthSchemeProvider = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.resolveHttpAuthSchemeConfig = exports.defaultSSOHttpAuthSchemeProvider = exports.defaultSSOHttpAuthSchemeParametersProvider = undefined;
  var httpAuthSchemes_1 = require_httpAuthSchemes();
  var util_middleware_1 = require_dist_cjs7();
  var defaultSSOHttpAuthSchemeParametersProvider = async (config, context, input) => {
    return {
      operation: (0, util_middleware_1.getSmithyContext)(context).operation,
      region: await (0, util_middleware_1.normalizeProvider)(config.region)() || (() => {
        throw new Error("expected `region` to be configured for `aws.auth#sigv4`");
      })()
    };
  };
  exports.defaultSSOHttpAuthSchemeParametersProvider = defaultSSOHttpAuthSchemeParametersProvider;
  function createAwsAuthSigv4HttpAuthOption(authParameters) {
    return {
      schemeId: "aws.auth#sigv4",
      signingProperties: {
        name: "awsssoportal",
        region: authParameters.region
      },
      propertiesExtractor: (config, context) => ({
        signingProperties: {
          config,
          context
        }
      })
    };
  }
  function createSmithyApiNoAuthHttpAuthOption(authParameters) {
    return {
      schemeId: "smithy.api#noAuth"
    };
  }
  var defaultSSOHttpAuthSchemeProvider = (authParameters) => {
    const options = [];
    switch (authParameters.operation) {
      case "GetRoleCredentials": {
        options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
        break;
      }
      default: {
        options.push(createAwsAuthSigv4HttpAuthOption(authParameters));
      }
    }
    return options;
  };
  exports.defaultSSOHttpAuthSchemeProvider = defaultSSOHttpAuthSchemeProvider;
  var resolveHttpAuthSchemeConfig = (config) => {
    const config_0 = (0, httpAuthSchemes_1.resolveAwsSdkSigV4Config)(config);
    return Object.assign(config_0, {
      authSchemePreference: (0, util_middleware_1.normalizeProvider)(config.authSchemePreference ?? [])
    });
  };
  exports.resolveHttpAuthSchemeConfig = resolveHttpAuthSchemeConfig;
});

// node_modules/.bun/@aws-sdk+nested-clients@3.996.17/node_modules/@aws-sdk/nested-clients/dist-cjs/submodules/sso/endpoint/ruleset.js
var require_ruleset = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ruleSet = undefined;
  var u = "required";
  var v = "fn";
  var w = "argv";
  var x = "ref";
  var a = true;
  var b = "isSet";
  var c = "booleanEquals";
  var d = "error";
  var e = "endpoint";
  var f = "tree";
  var g = "PartitionResult";
  var h = "getAttr";
  var i = { [u]: false, type: "string" };
  var j = { [u]: true, default: false, type: "boolean" };
  var k = { [x]: "Endpoint" };
  var l = { [v]: c, [w]: [{ [x]: "UseFIPS" }, true] };
  var m = { [v]: c, [w]: [{ [x]: "UseDualStack" }, true] };
  var n = {};
  var o = { [v]: h, [w]: [{ [x]: g }, "supportsFIPS"] };
  var p = { [x]: g };
  var q = { [v]: c, [w]: [true, { [v]: h, [w]: [p, "supportsDualStack"] }] };
  var r = [l];
  var s = [m];
  var t = [{ [x]: "Region" }];
  var _data = {
    version: "1.0",
    parameters: { Region: i, UseDualStack: j, UseFIPS: j, Endpoint: i },
    rules: [
      {
        conditions: [{ [v]: b, [w]: [k] }],
        rules: [
          { conditions: r, error: "Invalid Configuration: FIPS and custom endpoint are not supported", type: d },
          { conditions: s, error: "Invalid Configuration: Dualstack and custom endpoint are not supported", type: d },
          { endpoint: { url: k, properties: n, headers: n }, type: e }
        ],
        type: f
      },
      {
        conditions: [{ [v]: b, [w]: t }],
        rules: [
          {
            conditions: [{ [v]: "aws.partition", [w]: t, assign: g }],
            rules: [
              {
                conditions: [l, m],
                rules: [
                  {
                    conditions: [{ [v]: c, [w]: [a, o] }, q],
                    rules: [
                      {
                        endpoint: {
                          url: "https://portal.sso-fips.{Region}.{PartitionResult#dualStackDnsSuffix}",
                          properties: n,
                          headers: n
                        },
                        type: e
                      }
                    ],
                    type: f
                  },
                  { error: "FIPS and DualStack are enabled, but this partition does not support one or both", type: d }
                ],
                type: f
              },
              {
                conditions: r,
                rules: [
                  {
                    conditions: [{ [v]: c, [w]: [o, a] }],
                    rules: [
                      {
                        conditions: [{ [v]: "stringEquals", [w]: [{ [v]: h, [w]: [p, "name"] }, "aws-us-gov"] }],
                        endpoint: { url: "https://portal.sso.{Region}.amazonaws.com", properties: n, headers: n },
                        type: e
                      },
                      {
                        endpoint: {
                          url: "https://portal.sso-fips.{Region}.{PartitionResult#dnsSuffix}",
                          properties: n,
                          headers: n
                        },
                        type: e
                      }
                    ],
                    type: f
                  },
                  { error: "FIPS is enabled but this partition does not support FIPS", type: d }
                ],
                type: f
              },
              {
                conditions: s,
                rules: [
                  {
                    conditions: [q],
                    rules: [
                      {
                        endpoint: {
                          url: "https://portal.sso.{Region}.{PartitionResult#dualStackDnsSuffix}",
                          properties: n,
                          headers: n
                        },
                        type: e
                      }
                    ],
                    type: f
                  },
                  { error: "DualStack is enabled but this partition does not support DualStack", type: d }
                ],
                type: f
              },
              {
                endpoint: { url: "https://portal.sso.{Region}.{PartitionResult#dnsSuffix}", properties: n, headers: n },
                type: e
              }
            ],
            type: f
          }
        ],
        type: f
      },
      { error: "Invalid Configuration: Missing Region", type: d }
    ]
  };
  exports.ruleSet = _data;
});

// node_modules/.bun/@aws-sdk+nested-clients@3.996.17/node_modules/@aws-sdk/nested-clients/dist-cjs/submodules/sso/endpoint/endpointResolver.js
var require_endpointResolver = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.defaultEndpointResolver = undefined;
  var util_endpoints_1 = require_dist_cjs14();
  var util_endpoints_2 = require_dist_cjs13();
  var ruleset_1 = require_ruleset();
  var cache = new util_endpoints_2.EndpointCache({
    size: 50,
    params: ["Endpoint", "Region", "UseDualStack", "UseFIPS"]
  });
  var defaultEndpointResolver = (endpointParams, context = {}) => {
    return cache.get(endpointParams, () => (0, util_endpoints_2.resolveEndpoint)(ruleset_1.ruleSet, {
      endpointParams,
      logger: context.logger
    }));
  };
  exports.defaultEndpointResolver = defaultEndpointResolver;
  util_endpoints_2.customEndpointFunctions.aws = util_endpoints_1.awsEndpointFunctions;
});

// node_modules/.bun/@aws-sdk+nested-clients@3.996.17/node_modules/@aws-sdk/nested-clients/dist-cjs/submodules/sso/models/SSOServiceException.js
var require_SSOServiceException = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.SSOServiceException = exports.__ServiceException = undefined;
  var smithy_client_1 = require_dist_cjs8();
  Object.defineProperty(exports, "__ServiceException", { enumerable: true, get: function() {
    return smithy_client_1.ServiceException;
  } });

  class SSOServiceException extends smithy_client_1.ServiceException {
    constructor(options) {
      super(options);
      Object.setPrototypeOf(this, SSOServiceException.prototype);
    }
  }
  exports.SSOServiceException = SSOServiceException;
});

// node_modules/.bun/@aws-sdk+nested-clients@3.996.17/node_modules/@aws-sdk/nested-clients/dist-cjs/submodules/sso/models/errors.js
var require_errors = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.UnauthorizedException = exports.TooManyRequestsException = exports.ResourceNotFoundException = exports.InvalidRequestException = undefined;
  var SSOServiceException_1 = require_SSOServiceException();

  class InvalidRequestException extends SSOServiceException_1.SSOServiceException {
    name = "InvalidRequestException";
    $fault = "client";
    constructor(opts) {
      super({
        name: "InvalidRequestException",
        $fault: "client",
        ...opts
      });
      Object.setPrototypeOf(this, InvalidRequestException.prototype);
    }
  }
  exports.InvalidRequestException = InvalidRequestException;

  class ResourceNotFoundException extends SSOServiceException_1.SSOServiceException {
    name = "ResourceNotFoundException";
    $fault = "client";
    constructor(opts) {
      super({
        name: "ResourceNotFoundException",
        $fault: "client",
        ...opts
      });
      Object.setPrototypeOf(this, ResourceNotFoundException.prototype);
    }
  }
  exports.ResourceNotFoundException = ResourceNotFoundException;

  class TooManyRequestsException extends SSOServiceException_1.SSOServiceException {
    name = "TooManyRequestsException";
    $fault = "client";
    constructor(opts) {
      super({
        name: "TooManyRequestsException",
        $fault: "client",
        ...opts
      });
      Object.setPrototypeOf(this, TooManyRequestsException.prototype);
    }
  }
  exports.TooManyRequestsException = TooManyRequestsException;

  class UnauthorizedException extends SSOServiceException_1.SSOServiceException {
    name = "UnauthorizedException";
    $fault = "client";
    constructor(opts) {
      super({
        name: "UnauthorizedException",
        $fault: "client",
        ...opts
      });
      Object.setPrototypeOf(this, UnauthorizedException.prototype);
    }
  }
  exports.UnauthorizedException = UnauthorizedException;
});

// node_modules/.bun/@aws-sdk+nested-clients@3.996.17/node_modules/@aws-sdk/nested-clients/dist-cjs/submodules/sso/schemas/schemas_0.js
var require_schemas_0 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.GetRoleCredentials$ = exports.RoleCredentials$ = exports.GetRoleCredentialsResponse$ = exports.GetRoleCredentialsRequest$ = exports.errorTypeRegistries = exports.UnauthorizedException$ = exports.TooManyRequestsException$ = exports.ResourceNotFoundException$ = exports.InvalidRequestException$ = exports.SSOServiceException$ = undefined;
  var _ATT = "AccessTokenType";
  var _GRC = "GetRoleCredentials";
  var _GRCR = "GetRoleCredentialsRequest";
  var _GRCRe = "GetRoleCredentialsResponse";
  var _IRE = "InvalidRequestException";
  var _RC = "RoleCredentials";
  var _RNFE = "ResourceNotFoundException";
  var _SAKT = "SecretAccessKeyType";
  var _STT = "SessionTokenType";
  var _TMRE = "TooManyRequestsException";
  var _UE = "UnauthorizedException";
  var _aI = "accountId";
  var _aKI = "accessKeyId";
  var _aT = "accessToken";
  var _ai = "account_id";
  var _c = "client";
  var _e = "error";
  var _ex = "expiration";
  var _h = "http";
  var _hE = "httpError";
  var _hH = "httpHeader";
  var _hQ = "httpQuery";
  var _m = "message";
  var _rC = "roleCredentials";
  var _rN = "roleName";
  var _rn = "role_name";
  var _s = "smithy.ts.sdk.synthetic.com.amazonaws.sso";
  var _sAK = "secretAccessKey";
  var _sT = "sessionToken";
  var _xasbt = "x-amz-sso_bearer_token";
  var n0 = "com.amazonaws.sso";
  var schema_1 = require_schema();
  var errors_1 = require_errors();
  var SSOServiceException_1 = require_SSOServiceException();
  var _s_registry = schema_1.TypeRegistry.for(_s);
  exports.SSOServiceException$ = [-3, _s, "SSOServiceException", 0, [], []];
  _s_registry.registerError(exports.SSOServiceException$, SSOServiceException_1.SSOServiceException);
  var n0_registry = schema_1.TypeRegistry.for(n0);
  exports.InvalidRequestException$ = [-3, n0, _IRE, { [_e]: _c, [_hE]: 400 }, [_m], [0]];
  n0_registry.registerError(exports.InvalidRequestException$, errors_1.InvalidRequestException);
  exports.ResourceNotFoundException$ = [-3, n0, _RNFE, { [_e]: _c, [_hE]: 404 }, [_m], [0]];
  n0_registry.registerError(exports.ResourceNotFoundException$, errors_1.ResourceNotFoundException);
  exports.TooManyRequestsException$ = [-3, n0, _TMRE, { [_e]: _c, [_hE]: 429 }, [_m], [0]];
  n0_registry.registerError(exports.TooManyRequestsException$, errors_1.TooManyRequestsException);
  exports.UnauthorizedException$ = [-3, n0, _UE, { [_e]: _c, [_hE]: 401 }, [_m], [0]];
  n0_registry.registerError(exports.UnauthorizedException$, errors_1.UnauthorizedException);
  exports.errorTypeRegistries = [_s_registry, n0_registry];
  var AccessTokenType = [0, n0, _ATT, 8, 0];
  var SecretAccessKeyType = [0, n0, _SAKT, 8, 0];
  var SessionTokenType = [0, n0, _STT, 8, 0];
  exports.GetRoleCredentialsRequest$ = [
    3,
    n0,
    _GRCR,
    0,
    [_rN, _aI, _aT],
    [
      [0, { [_hQ]: _rn }],
      [0, { [_hQ]: _ai }],
      [() => AccessTokenType, { [_hH]: _xasbt }]
    ],
    3
  ];
  exports.GetRoleCredentialsResponse$ = [
    3,
    n0,
    _GRCRe,
    0,
    [_rC],
    [[() => exports.RoleCredentials$, 0]]
  ];
  exports.RoleCredentials$ = [
    3,
    n0,
    _RC,
    0,
    [_aKI, _sAK, _sT, _ex],
    [0, [() => SecretAccessKeyType, 0], [() => SessionTokenType, 0], 1]
  ];
  exports.GetRoleCredentials$ = [
    9,
    n0,
    _GRC,
    { [_h]: ["GET", "/federation/credentials", 200] },
    () => exports.GetRoleCredentialsRequest$,
    () => exports.GetRoleCredentialsResponse$
  ];
});

// node_modules/.bun/@aws-sdk+nested-clients@3.996.17/node_modules/@aws-sdk/nested-clients/dist-cjs/submodules/sso/runtimeConfig.shared.js
var require_runtimeConfig_shared = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.getRuntimeConfig = undefined;
  var httpAuthSchemes_1 = require_httpAuthSchemes();
  var protocols_1 = require_protocols();
  var core_1 = require_dist_cjs9();
  var smithy_client_1 = require_dist_cjs8();
  var url_parser_1 = require_dist_cjs4();
  var util_base64_1 = require_dist_cjs6();
  var util_utf8_1 = require_dist_cjs5();
  var httpAuthSchemeProvider_1 = require_httpAuthSchemeProvider();
  var endpointResolver_1 = require_endpointResolver();
  var schemas_0_1 = require_schemas_0();
  var getRuntimeConfig = (config) => {
    return {
      apiVersion: "2019-06-10",
      base64Decoder: config?.base64Decoder ?? util_base64_1.fromBase64,
      base64Encoder: config?.base64Encoder ?? util_base64_1.toBase64,
      disableHostPrefix: config?.disableHostPrefix ?? false,
      endpointProvider: config?.endpointProvider ?? endpointResolver_1.defaultEndpointResolver,
      extensions: config?.extensions ?? [],
      httpAuthSchemeProvider: config?.httpAuthSchemeProvider ?? httpAuthSchemeProvider_1.defaultSSOHttpAuthSchemeProvider,
      httpAuthSchemes: config?.httpAuthSchemes ?? [
        {
          schemeId: "aws.auth#sigv4",
          identityProvider: (ipc) => ipc.getIdentityProvider("aws.auth#sigv4"),
          signer: new httpAuthSchemes_1.AwsSdkSigV4Signer
        },
        {
          schemeId: "smithy.api#noAuth",
          identityProvider: (ipc) => ipc.getIdentityProvider("smithy.api#noAuth") || (async () => ({})),
          signer: new core_1.NoAuthSigner
        }
      ],
      logger: config?.logger ?? new smithy_client_1.NoOpLogger,
      protocol: config?.protocol ?? protocols_1.AwsRestJsonProtocol,
      protocolSettings: config?.protocolSettings ?? {
        defaultNamespace: "com.amazonaws.sso",
        errorTypeRegistries: schemas_0_1.errorTypeRegistries,
        version: "2019-06-10",
        serviceTarget: "SWBPortalService"
      },
      serviceId: config?.serviceId ?? "SSO",
      urlParser: config?.urlParser ?? url_parser_1.parseUrl,
      utf8Decoder: config?.utf8Decoder ?? util_utf8_1.fromUtf8,
      utf8Encoder: config?.utf8Encoder ?? util_utf8_1.toUtf8
    };
  };
  exports.getRuntimeConfig = getRuntimeConfig;
});

// node_modules/.bun/@aws-sdk+nested-clients@3.996.17/node_modules/@aws-sdk/nested-clients/dist-cjs/submodules/sso/runtimeConfig.js
var require_runtimeConfig = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.getRuntimeConfig = undefined;
  var tslib_1 = require_tslib();
  var package_json_1 = tslib_1.__importDefault(require_package());
  var client_1 = require_client();
  var httpAuthSchemes_1 = require_httpAuthSchemes();
  var util_user_agent_node_1 = require_dist_cjs21();
  var config_resolver_1 = require_dist_cjs17();
  var hash_node_1 = require_dist_cjs22();
  var middleware_retry_1 = require_dist_cjs20();
  var node_config_provider_1 = require_dist_cjs3();
  var node_http_handler_1 = require_dist_cjs2();
  var smithy_client_1 = require_dist_cjs8();
  var util_body_length_node_1 = require_dist_cjs23();
  var util_defaults_mode_node_1 = require_dist_cjs24();
  var util_retry_1 = require_dist_cjs15();
  var runtimeConfig_shared_1 = require_runtimeConfig_shared();
  var getRuntimeConfig = (config) => {
    (0, smithy_client_1.emitWarningIfUnsupportedVersion)(process.version);
    const defaultsMode = (0, util_defaults_mode_node_1.resolveDefaultsModeConfig)(config);
    const defaultConfigProvider = () => defaultsMode().then(smithy_client_1.loadConfigsForDefaultMode);
    const clientSharedValues = (0, runtimeConfig_shared_1.getRuntimeConfig)(config);
    (0, client_1.emitWarningIfUnsupportedVersion)(process.version);
    const loaderConfig = {
      profile: config?.profile,
      logger: clientSharedValues.logger
    };
    return {
      ...clientSharedValues,
      ...config,
      runtime: "node",
      defaultsMode,
      authSchemePreference: config?.authSchemePreference ?? (0, node_config_provider_1.loadConfig)(httpAuthSchemes_1.NODE_AUTH_SCHEME_PREFERENCE_OPTIONS, loaderConfig),
      bodyLengthChecker: config?.bodyLengthChecker ?? util_body_length_node_1.calculateBodyLength,
      defaultUserAgentProvider: config?.defaultUserAgentProvider ?? (0, util_user_agent_node_1.createDefaultUserAgentProvider)({ serviceId: clientSharedValues.serviceId, clientVersion: package_json_1.default.version }),
      maxAttempts: config?.maxAttempts ?? (0, node_config_provider_1.loadConfig)(middleware_retry_1.NODE_MAX_ATTEMPT_CONFIG_OPTIONS, config),
      region: config?.region ?? (0, node_config_provider_1.loadConfig)(config_resolver_1.NODE_REGION_CONFIG_OPTIONS, { ...config_resolver_1.NODE_REGION_CONFIG_FILE_OPTIONS, ...loaderConfig }),
      requestHandler: node_http_handler_1.NodeHttpHandler.create(config?.requestHandler ?? defaultConfigProvider),
      retryMode: config?.retryMode ?? (0, node_config_provider_1.loadConfig)({
        ...middleware_retry_1.NODE_RETRY_MODE_CONFIG_OPTIONS,
        default: async () => (await defaultConfigProvider()).retryMode || util_retry_1.DEFAULT_RETRY_MODE
      }, config),
      sha256: config?.sha256 ?? hash_node_1.Hash.bind(null, "sha256"),
      streamCollector: config?.streamCollector ?? node_http_handler_1.streamCollector,
      useDualstackEndpoint: config?.useDualstackEndpoint ?? (0, node_config_provider_1.loadConfig)(config_resolver_1.NODE_USE_DUALSTACK_ENDPOINT_CONFIG_OPTIONS, loaderConfig),
      useFipsEndpoint: config?.useFipsEndpoint ?? (0, node_config_provider_1.loadConfig)(config_resolver_1.NODE_USE_FIPS_ENDPOINT_CONFIG_OPTIONS, loaderConfig),
      userAgentAppId: config?.userAgentAppId ?? (0, node_config_provider_1.loadConfig)(util_user_agent_node_1.NODE_APP_ID_CONFIG_OPTIONS, loaderConfig)
    };
  };
  exports.getRuntimeConfig = getRuntimeConfig;
});

// node_modules/.bun/@aws-sdk+nested-clients@3.996.17/node_modules/@aws-sdk/nested-clients/dist-cjs/submodules/sso/index.js
var require_sso = __commonJS((exports) => {
  var middlewareHostHeader = require_dist_cjs10();
  var middlewareLogger = require_dist_cjs11();
  var middlewareRecursionDetection = require_dist_cjs12();
  var middlewareUserAgent = require_dist_cjs16();
  var configResolver = require_dist_cjs17();
  var core = require_dist_cjs9();
  var schema = require_schema();
  var middlewareContentLength = require_dist_cjs18();
  var middlewareEndpoint = require_dist_cjs19();
  var middlewareRetry = require_dist_cjs20();
  var smithyClient = require_dist_cjs8();
  var httpAuthSchemeProvider = require_httpAuthSchemeProvider();
  var runtimeConfig = require_runtimeConfig();
  var regionConfigResolver = require_dist_cjs25();
  var protocolHttp = require_dist_cjs();
  var schemas_0 = require_schemas_0();
  var errors = require_errors();
  var SSOServiceException = require_SSOServiceException();
  var resolveClientEndpointParameters = (options) => {
    return Object.assign(options, {
      useDualstackEndpoint: options.useDualstackEndpoint ?? false,
      useFipsEndpoint: options.useFipsEndpoint ?? false,
      defaultSigningName: "awsssoportal"
    });
  };
  var commonParams = {
    UseFIPS: { type: "builtInParams", name: "useFipsEndpoint" },
    Endpoint: { type: "builtInParams", name: "endpoint" },
    Region: { type: "builtInParams", name: "region" },
    UseDualStack: { type: "builtInParams", name: "useDualstackEndpoint" }
  };
  var getHttpAuthExtensionConfiguration = (runtimeConfig2) => {
    const _httpAuthSchemes = runtimeConfig2.httpAuthSchemes;
    let _httpAuthSchemeProvider = runtimeConfig2.httpAuthSchemeProvider;
    let _credentials = runtimeConfig2.credentials;
    return {
      setHttpAuthScheme(httpAuthScheme) {
        const index = _httpAuthSchemes.findIndex((scheme) => scheme.schemeId === httpAuthScheme.schemeId);
        if (index === -1) {
          _httpAuthSchemes.push(httpAuthScheme);
        } else {
          _httpAuthSchemes.splice(index, 1, httpAuthScheme);
        }
      },
      httpAuthSchemes() {
        return _httpAuthSchemes;
      },
      setHttpAuthSchemeProvider(httpAuthSchemeProvider2) {
        _httpAuthSchemeProvider = httpAuthSchemeProvider2;
      },
      httpAuthSchemeProvider() {
        return _httpAuthSchemeProvider;
      },
      setCredentials(credentials) {
        _credentials = credentials;
      },
      credentials() {
        return _credentials;
      }
    };
  };
  var resolveHttpAuthRuntimeConfig = (config) => {
    return {
      httpAuthSchemes: config.httpAuthSchemes(),
      httpAuthSchemeProvider: config.httpAuthSchemeProvider(),
      credentials: config.credentials()
    };
  };
  var resolveRuntimeExtensions = (runtimeConfig2, extensions) => {
    const extensionConfiguration = Object.assign(regionConfigResolver.getAwsRegionExtensionConfiguration(runtimeConfig2), smithyClient.getDefaultExtensionConfiguration(runtimeConfig2), protocolHttp.getHttpHandlerExtensionConfiguration(runtimeConfig2), getHttpAuthExtensionConfiguration(runtimeConfig2));
    extensions.forEach((extension) => extension.configure(extensionConfiguration));
    return Object.assign(runtimeConfig2, regionConfigResolver.resolveAwsRegionExtensionConfiguration(extensionConfiguration), smithyClient.resolveDefaultRuntimeConfig(extensionConfiguration), protocolHttp.resolveHttpHandlerRuntimeConfig(extensionConfiguration), resolveHttpAuthRuntimeConfig(extensionConfiguration));
  };

  class SSOClient extends smithyClient.Client {
    config;
    constructor(...[configuration]) {
      const _config_0 = runtimeConfig.getRuntimeConfig(configuration || {});
      super(_config_0);
      this.initConfig = _config_0;
      const _config_1 = resolveClientEndpointParameters(_config_0);
      const _config_2 = middlewareUserAgent.resolveUserAgentConfig(_config_1);
      const _config_3 = middlewareRetry.resolveRetryConfig(_config_2);
      const _config_4 = configResolver.resolveRegionConfig(_config_3);
      const _config_5 = middlewareHostHeader.resolveHostHeaderConfig(_config_4);
      const _config_6 = middlewareEndpoint.resolveEndpointConfig(_config_5);
      const _config_7 = httpAuthSchemeProvider.resolveHttpAuthSchemeConfig(_config_6);
      const _config_8 = resolveRuntimeExtensions(_config_7, configuration?.extensions || []);
      this.config = _config_8;
      this.middlewareStack.use(schema.getSchemaSerdePlugin(this.config));
      this.middlewareStack.use(middlewareUserAgent.getUserAgentPlugin(this.config));
      this.middlewareStack.use(middlewareRetry.getRetryPlugin(this.config));
      this.middlewareStack.use(middlewareContentLength.getContentLengthPlugin(this.config));
      this.middlewareStack.use(middlewareHostHeader.getHostHeaderPlugin(this.config));
      this.middlewareStack.use(middlewareLogger.getLoggerPlugin(this.config));
      this.middlewareStack.use(middlewareRecursionDetection.getRecursionDetectionPlugin(this.config));
      this.middlewareStack.use(core.getHttpAuthSchemeEndpointRuleSetPlugin(this.config, {
        httpAuthSchemeParametersProvider: httpAuthSchemeProvider.defaultSSOHttpAuthSchemeParametersProvider,
        identityProviderConfigProvider: async (config) => new core.DefaultIdentityProviderConfig({
          "aws.auth#sigv4": config.credentials
        })
      }));
      this.middlewareStack.use(core.getHttpSigningPlugin(this.config));
    }
    destroy() {
      super.destroy();
    }
  }

  class GetRoleCredentialsCommand extends smithyClient.Command.classBuilder().ep(commonParams).m(function(Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
  }).s("SWBPortalService", "GetRoleCredentials", {}).n("SSOClient", "GetRoleCredentialsCommand").sc(schemas_0.GetRoleCredentials$).build() {
  }
  var commands = {
    GetRoleCredentialsCommand
  };

  class SSO extends SSOClient {
  }
  smithyClient.createAggregatedClient(commands, SSO);
  exports.$Command = smithyClient.Command;
  exports.__Client = smithyClient.Client;
  exports.SSOServiceException = SSOServiceException.SSOServiceException;
  exports.GetRoleCredentialsCommand = GetRoleCredentialsCommand;
  exports.SSO = SSO;
  exports.SSOClient = SSOClient;
  Object.prototype.hasOwnProperty.call(schemas_0, "__proto__") && !Object.prototype.hasOwnProperty.call(exports, "__proto__") && Object.defineProperty(exports, "__proto__", {
    enumerable: true,
    value: schemas_0["__proto__"]
  });
  Object.keys(schemas_0).forEach(function(k) {
    if (k !== "default" && !Object.prototype.hasOwnProperty.call(exports, k))
      exports[k] = schemas_0[k];
  });
  Object.prototype.hasOwnProperty.call(errors, "__proto__") && !Object.prototype.hasOwnProperty.call(exports, "__proto__") && Object.defineProperty(exports, "__proto__", {
    enumerable: true,
    value: errors["__proto__"]
  });
  Object.keys(errors).forEach(function(k) {
    if (k !== "default" && !Object.prototype.hasOwnProperty.call(exports, k))
      exports[k] = errors[k];
  });
});

// node_modules/.bun/@aws-sdk+credential-provider-sso@3.972.27/node_modules/@aws-sdk/credential-provider-sso/dist-es/loadSso.js
var import_sso;
var init_loadSso = __esm(() => {
  import_sso = __toESM(require_sso(), 1);
});
init_loadSso();
var export_SSOClient = import_sso.SSOClient;
var export_GetRoleCredentialsCommand = import_sso.GetRoleCredentialsCommand;

export {
  export_SSOClient as SSOClient,
  export_GetRoleCredentialsCommand as GetRoleCredentialsCommand
};
