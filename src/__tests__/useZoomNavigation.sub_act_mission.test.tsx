import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { render, act } from '@testing-library/react';
import { useZoomNavigation } from '@/hooks/CampaignEditor/VisualFlowEditor/useZoomNavigation';

// Mock delle utility usate in handleNavigateToSubScript
jest.mock('@/utils/CampaignEditor/VisualFlowEditor/blockIdManager', () => ({
  addUniqueIds: (blocks: any[]) => blocks
}));
jest.mock('@/utils/CampaignEditor/VisualFlowEditor/blockCleaner', () => ({
  cleanupScriptBlocks: (blocks: any[]) => blocks
}));

// Harness per esporre le API del hook
const Harness = forwardRef<any, {
  initialBlocks: any[];
  opened?: Map<string, any>;
  currentScript?: { name: string; fileName: string } | null;
}>((props, ref) => {
  const [blocks, setBlocks] = useState<any[]>(props.initialBlocks);
  const [openedScripts, setOpenedScripts] = useState<Map<string, any>>(props.opened || new Map());
  const [currentScriptContext, setCurrentScriptContext] = useState<any>(null);

  const hook = useZoomNavigation({
    currentScriptBlocks: blocks,
    setCurrentScriptBlocks: setBlocks,
    openedScripts,
    setOpenedScripts,
    currentScriptContext,
    setCurrentScriptContext,
    currentScript: props.currentScript || { name: 'Main', fileName: 'Main.txt' }
  });

  useImperativeHandle(ref, () => ({
    zoomIn: (id: string) => hook.handleZoomIn(id),
    zoomOutTo: (idx: number) => hook.handleZoomOut(idx),
    backToScript: (targetIndex: number, zoomIdx?: number) => hook.handleNavigateBackToScript(targetIndex, zoomIdx),
    setPath: (path: any[]) => hook.setNavigationPath(path),
    getPath: () => hook.navigationPath,
    getBlocks: () => blocks,
    setOpened: (map: Map<string, any>) => setOpenedScripts(map),
  }));

  return null;
});

describe('useZoomNavigation - SUB_SCRIPT and ACT_MISSION markers', () => {
  beforeEach(() => {
    // Mock fetch per caricare un sub-script
    // Restituisce uno script minimale con un IF vuoto
    // @ts-ignore
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          fileName: 'SubA.txt',
          blocks: [ { id: 'sub-if', type: 'IF', thenBlocks: [], elseBlocks: [] } ]
        }
      })
    });
  });

  test('navigazione SUB_SCRIPT: crea marker, carica script e ritorna allo script principale', async () => {
    const blocks = [
      {
        id: 'root-if', type: 'IF', isContainer: true, thenBlocks: [
          { id: 'goSub', type: 'SUB_SCRIPT', parameters: { scriptName: 'SubA' } }
        ]
      }
    ];

    const ref: any = { current: null };
    render(<Harness ref={(r) => (ref.current = r)} initialBlocks={blocks} currentScript={{ name: 'Main', fileName: 'Main.txt' }} />);

    // ZOOM nel container IF
    await act(async () => {
      await ref.current.zoomIn('root-if');
    });
    // ZOOM nel SUB_SCRIPT -> attiva handleNavigateToSubScript
    await act(async () => {
      await ref.current.zoomIn('goSub');
    });

    const path = ref.current.getPath();
    expect(path[path.length - 1].id).toBe('subscript-SubA');
    // La vista corrente deve essere lo script wrapper del sub-script
    const cur = ref.current.getBlocks();
    expect(cur).toHaveLength(1);
    expect(cur[0].type).toBe('SCRIPT');

    // Torna allo script principale alla vista root
    await act(async () => {
      await ref.current.backToScript(-1, -1);
    });
    const curAfter = ref.current.getBlocks();
    // Torna ai blocchi originali
    expect(curAfter).toHaveLength(1);
    expect(curAfter[0].id).toBe('root-if');
  });

  test('ACT_MISSION marker: click sul marker ripristina la vista root della mission', async () => {
    const ref: any = { current: null };
    // Prepara uno script di missione caricato in memoria
    const missionMap = new Map<string, any>();
    missionMap.set('MissionX', {
      scriptName: 'MissionX',
      fileName: 'MissionX.txt',
      blocks: [ { id: 'mission-script', type: 'SCRIPT', children: [] } ]
    });

    render(
      <Harness
        ref={(r) => (ref.current = r)}
        initialBlocks={[{ id: 'a', type: 'LABEL', parameters: { name: 'L' } }]}
        opened={missionMap}
        currentScript={{ name: 'Main', fileName: 'Main.txt' }}
      />
    );

    // Imposta un path che contiene un marker mission-
    const marker = { id: 'mission-MissionX', name: 'MissionX', block: { id: 'mission-script', type: 'SCRIPT' } };
    await act(async () => {
      ref.current.setPath([marker, { id: 'zoom-1', name: 'IF', block: { id: 'z1', type: 'IF' } }]);
    });

    // Clic esplicito sul marker: livello indice 0
    await act(async () => {
      await ref.current.zoomOutTo(0);
    });

    const path2 = ref.current.getPath();
    expect(path2).toHaveLength(1);
    expect(path2[0].id).toBe('mission-MissionX');
    const blocks2 = ref.current.getBlocks();
    expect(blocks2).toHaveLength(1);
    expect(blocks2[0].type).toBe('SCRIPT');
  });
});
