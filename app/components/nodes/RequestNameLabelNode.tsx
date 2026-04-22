'use client';

import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';

/**
 * A non-interactive annotation node that displays the RequestName
 * above each workflow column. It acts as a header label.
 */
function RequestNameLabelNode({ data }: NodeProps) {
    const typedData = data as { label?: string; requestName?: string };
    const requestName = typedData.requestName ?? '';

    return (
        <div className="request-name-label-node">
            <div className="request-name-label-title">Request Name:</div>
            <div className="request-name-label-value">{requestName}</div>
        </div>
    );
}

const MemoRequestNameLabelNode = memo(RequestNameLabelNode);
MemoRequestNameLabelNode.displayName = 'RequestNameLabelNode';

export default MemoRequestNameLabelNode;
