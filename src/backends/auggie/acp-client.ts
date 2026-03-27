import { AcpSubprocessLightweightClient } from "../lightweight/acp-subprocess-client.js";

export class AuggieAcpClient extends AcpSubprocessLightweightClient {
  constructor() {
    super({
      backendId: "auggie",
      backendLabel: "Auggie",
      defaultCommand: "auggie",
      defaultArgs: ["--acp"],
      commandEnvVarNames: ["WEIXIN_AUGGIE_ACP_BIN", "AUGGIE_ACP_BIN"],
      argsEnvVarNames: ["WEIXIN_AUGGIE_ACP_ARGS", "AUGGIE_ACP_ARGS"],
      cwdEnvVarNames: ["WEIXIN_AUGGIE_ACP_CWD", "AUGGIE_ACP_CWD"],
      permissionModeEnvVarNames: ["WEIXIN_AUGGIE_ACP_PERMISSION_MODE", "AUGGIE_ACP_PERMISSION_MODE"],
      missingCommandHint: "Install auggie or set WEIXIN_AUGGIE_ACP_BIN.",
      authRequiredHint: "Auggie ACP requires authentication. Run `auggie` manually in the target workdir and complete login first.",
      mediaOutDirName: "auggie-acp-out",
      cancelledMessage: "Auggie 已取消当前操作。",
    });
  }
}
