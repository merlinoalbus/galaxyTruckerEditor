import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { render, act } from '@testing-library/react';
import { useZoomNavigation } from '@/hooks/CampaignEditor/VisualFlowEditor/useZoomNavigation';

const Harness = forwardRef<any, { initialBlocks: any[] }>((props, ref) => {
  const [blocks, setBlocks] = useState<any[]>(props.initialBlocks);
  const hook = useZoomNavigation({
    currentScriptBlocks: blocks,
    setCurrentScriptBlocks: setBlocks,
  });

  useImperativeHandle(ref, () => ({
    zoomIn: (id: string) => hook.handleZoomIn(id),
    getNavigationPath: () => hook.navigationPath,
    getFocused: () => hook.currentFocusedBlock,
    getCurrentBlocks: () => blocks,
  }));

  return null;
});

describe('useZoomNavigation - zoom and breadcrumbs sync', () => {
  test('zooming into a container updates navigationPath and shows only that block', async () => {
    const blocks = [
      {
        id: 'root-if', type: 'IF', isContainer: true, thenBlocks: [
          { id: 'lbl1', type: 'LABEL', parameters: { name: 'L1' } },
          { id: 'say1', type: 'SAY', parameters: { text: { EN: 'Hi' } } }
        ]
      }
    ];

    const ref: any = { current: null };
    render(<Harness ref={(r) => (ref.current = r)} initialBlocks={blocks} />);

    await act(async () => {
      await ref.current.zoomIn('root-if');
    });

    // After zoom-in, breadcrumb should have at least one entry and focus is the IF block
    const path = ref.current.getNavigationPath();
    expect(path.length).toBeGreaterThanOrEqual(1);
    expect(ref.current.getFocused()?.id).toBe('root-if');

    // Only the IF block should be shown as current root
    const currentBlocks = ref.current.getCurrentBlocks();
    expect(currentBlocks).toHaveLength(1);
    expect(currentBlocks[0].id).toBe('root-if');
  });
});
