import React from 'react';
import { 
  GitBranch,      // IF
  MessageSquare,  // SAY
  Clock,          // DELAY
  ArrowRight,     // GO
  Tag,            // LABEL
  Menu,           // MENU
  Circle,         // OPT
  FileCode,       // SCRIPT
  Variable,       // VAR
  Play,           // CALL
  Save,           // SAVE
  Loader,         // LOAD
  Camera,         // IMAGE
  Video,          // MOVIE
  Music,          // SOUND
  AlertCircle,    // CONFIRM
  TextCursor,     // INPUT
  Coins,          // ADD_CREDITS
  Trophy,         // MISSION
  Gift,           // REWARD
  ShoppingCart,   // PURCHASE
  Users,          // SOCIAL
  TrendingUp,     // ANALYTICS
  Settings,       // CONFIG
  Database,       // DATA
  Zap             // MODIFYOPPONENTSBUILDSPEED
} from 'lucide-react';

export const BLOCK_ICONS = {
  // Container blocks
  SCRIPT: <FileCode className="w-4 h-4" />,
  IF: <GitBranch className="w-4 h-4" />,
  IFNOT: <GitBranch className="w-4 h-4 rotate-180" />,
  IF_DEBUG: <GitBranch className="w-4 h-4" />,
  IF_FROM_CAMPAIGN: <GitBranch className="w-4 h-4" />,
  IF_HAS_CREDITS: <Coins className="w-4 h-4" />,
  IF_IS: <GitBranch className="w-4 h-4" />,
  IF_MAX: <TrendingUp className="w-4 h-4" />,
  IF_MIN: <TrendingUp className="w-4 h-4 rotate-180" />,
  IF_MISSION_WON: <Trophy className="w-4 h-4" />,
  IF_ORDER: <GitBranch className="w-4 h-4" />,
  IF_PROB: <GitBranch className="w-4 h-4" />,
  IF_TUTORIAL_SEEN: <GitBranch className="w-4 h-4" />,
  IFMISSIONRESULTIS: <Trophy className="w-4 h-4" />,
  IFMISSIONRESULTMIN: <Trophy className="w-4 h-4" />,
  MENU: <Menu className="w-4 h-4" />,
  OPT: <Circle className="w-4 h-4" />,
  
  // Command blocks
  SAY: <MessageSquare className="w-4 h-4" />,
  DELAY: <Clock className="w-4 h-4" />,
  GO: <ArrowRight className="w-4 h-4" />,
  LABEL: <Tag className="w-4 h-4" />,
  VAR: <Variable className="w-4 h-4" />,
  CALL: <Play className="w-4 h-4" />,
  SAVE: <Save className="w-4 h-4" />,
  LOAD: <Loader className="w-4 h-4" />,
  IMAGE: <Camera className="w-4 h-4" />,
  MOVIE: <Video className="w-4 h-4" />,
  SOUND: <Music className="w-4 h-4" />,
  CONFIRM: <AlertCircle className="w-4 h-4" />,
  INPUT: <TextCursor className="w-4 h-4" />,
  ADD_CREDITS: <Coins className="w-4 h-4" />,
  MISSION: <Trophy className="w-4 h-4" />,
  REWARD: <Gift className="w-4 h-4" />,
  PURCHASE: <ShoppingCart className="w-4 h-4" />,
  SOCIAL: <Users className="w-4 h-4" />,
  ANALYTICS: <TrendingUp className="w-4 h-4" />,
  CONFIG: <Settings className="w-4 h-4" />,
  DATA: <Database className="w-4 h-4" />,
  
  // Mission blocks
  MODIFYOPPONENTSBUILDSPEED: <Zap className="w-4 h-4" />
};

export const getBlockIcon = (type: string): React.ReactNode => {
  return BLOCK_ICONS[type as keyof typeof BLOCK_ICONS] || <FileCode className="w-4 h-4" />;
};