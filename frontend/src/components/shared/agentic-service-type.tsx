import {AppType} from '@/types/api/app';
import {cn} from '@/lib/utils';
import MCPIcon from '@/assets/types-agentic-services/mcp.svg?react';
import OASFIcon from '@/assets/types-agentic-services/agntcy.svg?react';
import A2AIcon from '@/assets/types-agentic-services/a2a.svg?react';
import {Typography} from '@mui/material';
import {labels} from '@/constants/labels';

export const AgenticServiceType = ({type, className}: {type?: AppType; className?: string}) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {type === AppType.APP_TYPE_MCP_SERVER && <MCPIcon className="h-[20px] w-[20px]" />}
      {type === AppType.APP_TYPE_AGENT_OASF && <OASFIcon className="h-[20px] w-[20px]" />}
      {type === AppType.APP_TYPE_AGENT_A2A && <A2AIcon className="h-[20px] w-[20px]" />}
      <Typography
        variant="body1"
        fontSize={14}
        sx={(theme) => ({
          color: theme.palette.vars.baseTextStrong
        })}
      >
        {labels.appTypes[type as keyof typeof labels.appTypes] || 'Unknown Service Type'}
      </Typography>
    </div>
  );
};
