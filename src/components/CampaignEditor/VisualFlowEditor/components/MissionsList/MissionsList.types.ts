export interface MissionItem {
  nomemission: string;
  nomefile: string;
  numero_blocchi: number;
  numero_comandi: number;
  stellato: boolean;
  languages: string[];
}

export interface MissionsListProps {
  showMissionsList: boolean;
  setShowMissionsList: (show: boolean) => void;
  loadMission: (missionId: string) => void;
  buttonRef?: React.RefObject<HTMLButtonElement>;
}