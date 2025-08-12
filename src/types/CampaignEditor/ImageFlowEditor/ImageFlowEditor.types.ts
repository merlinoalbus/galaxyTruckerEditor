export interface ScriptContainer {
  id: string;
  type: string;
  position: { x: number; y: number };
  scriptName: string;
  fileName: string;
  language: string;
  languages: string[];
  variables: any[];
  semaphores: any[];
  labels: any[];
  referencedScripts: any[];
  referencedMissions: any[];
  executionOrder: string;
  allowParallelExecution: boolean;
  canBeInterrupted: boolean;
  isReusable: boolean;
  metadata: {
    createdAt: Date;
    modifiedAt: Date;
  };
  children: any[];
  isContainer: boolean;
  isCollapsible: boolean;
  defaultCollapsed: boolean;
  childCount: number;
  maxChildren?: number;
  acceptedChildTypes?: string[];
  nestingDepth: number;
  data: Record<string, any>;
}