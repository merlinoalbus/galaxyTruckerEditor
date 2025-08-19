import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { render, act } from '@testing-library/react';
import { useZoomNavigation } from '@/hooks/CampaignEditor/VisualFlowEditor/useZoomNavigation';

// Mocks per util usate nel caricamento sub-script
jest.mock('@/utils/CampaignEditor/VisualFlowEditor/blockIdManager', () => ({
  addUniqueIds: (blocks: any[]) => blocks
}));
jest.mock('@/utils/CampaignEditor/VisualFlowEditor/blockCleaner', () => ({
  cleanupScriptBlocks: (blocks: any[]) => blocks
}));

const Harness = forwardRef<any, {
  initialBlocks: any[];
  currentScript?: { name: string; fileName: string } | null;
}>((props, ref) => {
  const [blocks, setBlocks] = useState<any[]>(props.initialBlocks);
  const [openedScripts, setOpenedScripts] = useState<Map<string, any>>(new Map());
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
    getPath: () => hook.navigationPath,
    setPath: (path: any[]) => hook.setNavigationPath(path),
    getBlocks: () => blocks,
    setOpened: (map: Map<string, any>) => (setOpenedScripts(map)),
  }));

  return null;
});

describe('useZoomNavigation - E2E: breadcrumb multipli con SUB_SCRIPT e ACT_MISSION', () => {
  beforeEach(() => {
    // Mock fetch: restituisce contenuti diversi per SubA e SubB
    // @ts-ignore
    global.fetch = jest.fn().mockImplementation((input: RequestInfo) => {
      const url = String(input);
      if (url.includes('/scripts/SubA')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, data: { fileName: 'SubA.txt', blocks: [
            { id: 'subA-inner', type: 'IF', thenBlocks: [ { id: 'toSubB', type: 'SUB_SCRIPT', parameters: { scriptName: 'SubB' } } ], elseBlocks: [] }
          ] }})
        });
      }
      if (url.includes('/scripts/SubB')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, data: { fileName: 'SubB.txt', blocks: [
            { id: 'subB-if', type: 'IF', thenBlocks: [], elseBlocks: [] }
          ] }})
        });
      }
      return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
    });
  });

  test('Main -> SubA -> SubB poi marker mission: click sui vari marker ripristina i blocchi corretti', async () => {
    const mainBlocks = [
      { id: 'main-if', type: 'IF', isContainer: true, thenBlocks: [ { id: 'toSubA', type: 'SUB_SCRIPT', parameters: { scriptName: 'SubA' } } ] }
    ];

    const ref: any = { current: null };
    render(<Harness ref={(r) => (ref.current = r)} initialBlocks={mainBlocks} currentScript={{ name: 'Main', fileName: 'Main.txt' }} />);

    // Entra in SubA
    await act(async () => { await ref.current.zoomIn('main-if'); });
    await act(async () => { await ref.current.zoomIn('toSubA'); });
    // Entra in SubB dal subscript SubA
    const subAChildId = 'toSubB';
    await act(async () => { await ref.current.zoomIn(subAChildId); });

    // Ora aggiungo un marker mission manualmente e preparo openedScripts con MissionX
    const missionMap = new Map<string, any>();
    missionMap.set('MissionX', {
      scriptName: 'MissionX',
      fileName: 'MissionX.txt',
      blocks: [ { id: 'mission-script', type: 'SCRIPT', children: [ { id: 'm1', type: 'LABEL', parameters: { name: 'L' } } ] } ]
    });
  await act(async () => { ref.current.setOpened(missionMap); });

    const pathNow = ref.current.getPath();
    // costruisco un nuovo path aggiungendo marker mission in coda
    const withMission = [...pathNow, { id: 'mission-MissionX', name: 'MissionX', block: { id: 'mission-script', type: 'SCRIPT' } }];
    await act(async () => { ref.current.setPath(withMission); });

    // Clic sul marker mission (ultimo indice)
    await act(async () => { await ref.current.zoomOutTo(withMission.length - 1); });
    const blocksAtMission = ref.current.getBlocks();
    expect(blocksAtMission).toHaveLength(1);
    expect(blocksAtMission[0].type).toBe('SCRIPT');

    // Clic sul marker precedente (subscript-SubB)
    const subBMarkerIdx = withMission.length - 2;
    await act(async () => { await ref.current.zoomOutTo(subBMarkerIdx); });
    const blocksAtSubB = ref.current.getBlocks();
    expect(blocksAtSubB).toHaveLength(1);
    // dovremmo tornare al wrapper SCRIPT del subscript corrente
    expect(['SCRIPT', 'IF']).toContain(blocksAtSubB[0].type);

    // Clic sul marker precedente ancora (subscript-SubA)
    const subAMarkerIdx = withMission.length - 3;
    await act(async () => { await ref.current.zoomOutTo(subAMarkerIdx); });
    const blocksAtSubA = ref.current.getBlocks();
    expect(blocksAtSubA.length).toBeGreaterThanOrEqual(1);
  });
});
