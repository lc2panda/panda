import * as React from 'react';
import { Box, Text } from '../../ink.js';
import { isZh } from '../../utils/i18n.js';
import { Select } from '../CustomSelect/select.js';
import { PermissionDialog } from '../permissions/PermissionDialog.js';
type Props = {
  pluginName: string;
  pluginDescription?: string;
  marketplaceName: string;
  sourceCommand: string;
  onResponse: (response: 'yes' | 'no' | 'disable') => void;
};
const AUTO_DISMISS_MS = 30_000;
export function PluginHintMenu({
  pluginName,
  pluginDescription,
  marketplaceName,
  sourceCommand,
  onResponse
}: Props): React.ReactNode {
  const onResponseRef = React.useRef(onResponse);
  onResponseRef.current = onResponse;
  React.useEffect(() => {
    const timeoutId = setTimeout(ref => ref.current('no'), AUTO_DISMISS_MS, onResponseRef);
    return () => clearTimeout(timeoutId);
  }, []);
  function onSelect(value: string): void {
    switch (value) {
      case 'yes':
        onResponse('yes');
        break;
      case 'disable':
        onResponse('disable');
        break;
      default:
        onResponse('no');
    }
  }
  const options = [{
    label: <Text>
          Yes, install <Text bold>{pluginName}</Text>
        </Text>,
    value: 'yes'
  }, {
    label: 'No',
    value: 'no'
  }, {
    label: isZh() ? "否，且不再显示插件安装提示" : "No, and don't show plugin installation hints again",
    value: 'disable'
  }];
  return <PermissionDialog title={isZh() ? "插件推荐" : "Plugin Recommendation"}>
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Box marginBottom={1}>
          <Text dimColor>
            The <Text bold>{sourceCommand}</Text> command suggests installing a
            plugin.
          </Text>
        </Box>
        <Box>
          <Text dimColor>Plugin:</Text>
          <Text> {pluginName}</Text>
        </Box>
        <Box>
          <Text dimColor>Marketplace:</Text>
          <Text> {marketplaceName}</Text>
        </Box>
        {pluginDescription && <Box>
            <Text dimColor>{pluginDescription}</Text>
          </Box>}
        <Box marginTop={1}>
          <Text>Would you like to install it?</Text>
        </Box>
        <Box>
          <Select options={options} onChange={onSelect} onCancel={() => onResponse('no')} />
        </Box>
      </Box>
    </PermissionDialog>;
}
