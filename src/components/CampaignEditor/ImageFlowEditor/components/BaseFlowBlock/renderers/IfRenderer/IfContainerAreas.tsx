import React, { useState, useRef } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  IconButton, 
  Menu, 
  MenuItem,
  Collapse,
  Fade,
  Stack,
  Divider,
  Badge,
  Tooltip,
  Button
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  DragIndicator as DragIcon,
  CheckCircle as ThenIcon,
  Cancel as ElseIcon,
  MoreVert as MoreIcon
} from '@mui/icons-material';
import { Block } from '../../../../../../../types/CampaignEditor/VisualFlowEditor/BlockTypes';

interface ContainerAreaProps {
  type: 'then' | 'else';
  blocks: Block[];
  onAddBlock: (blockType: string) => void;
  onRemoveBlock: (blockId: string) => void;
  onUpdateBlock: (blockId: string, updates: Partial<Block>) => void;
  onMoveBlock: (fromIndex: number, toIndex: number) => void;
  renderBlock?: (block: Block) => React.ReactNode;
  expanded?: boolean;
  disabled?: boolean;
}

const BLOCK_TYPES = [
  { value: 'DIALOG', label: 'Dialogo' },
  { value: 'MISSION', label: 'Missione' },
  { value: 'VARIABLE', label: 'Variabile' },
  { value: 'SOUND', label: 'Suono' },
  { value: 'CHARACTER', label: 'Personaggio' },
  { value: 'NAVIGATION', label: 'Navigazione' },
  { value: 'IF', label: 'Condizione IF' },
  { value: 'CONTAINER', label: 'Container' }
];

export const IfContainerArea: React.FC<ContainerAreaProps> = ({
  type,
  blocks,
  onAddBlock,
  onRemoveBlock,
  onUpdateBlock,
  onMoveBlock,
  renderBlock,
  expanded = true,
  disabled = false
}) => {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [addMenuAnchor, setAddMenuAnchor] = useState<null | HTMLElement>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const dragOverIndex = useRef<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    dragOverIndex.current = index;
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex.current !== null && draggedIndex !== dragOverIndex.current) {
      onMoveBlock(draggedIndex, dragOverIndex.current);
    }
    setDraggedIndex(null);
    dragOverIndex.current = null;
  };

  const handleAddClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAddMenuAnchor(event.currentTarget);
  };

  const handleAddClose = () => {
    setAddMenuAnchor(null);
  };

  const handleBlockTypeSelect = (blockType: string) => {
    onAddBlock(blockType);
    handleAddClose();
  };

  const containerColor = type === 'then' ? 'success' : 'warning';
  const containerIcon = type === 'then' ? <ThenIcon /> : <ElseIcon />;
  const containerLabel = type === 'then' ? 'THEN' : 'ELSE';

  return (
    <Paper
      elevation={2}
      sx={{
        flex: 1,
        minHeight: 250,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderLeft: 4,
        borderLeftColor: `${containerColor}.main`,
        bgcolor: 'background.paper',
        position: 'relative'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1,
          bgcolor: `${containerColor}.main`,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          {containerIcon}
          <Typography variant="subtitle2" fontWeight="bold">
            {containerLabel}
          </Typography>
          <Badge badgeContent={blocks.length} color="default" />
        </Stack>
        
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Aggiungi blocco">
            <IconButton 
              size="small" 
              sx={{ color: 'white' }}
              onClick={handleAddClick}
              disabled={disabled}
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
          <IconButton
            size="small"
            sx={{ color: 'white' }}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Stack>
      </Box>

      {/* Content Area */}
      <Collapse in={isExpanded} timeout="auto">
        <Box
          sx={{
            flex: 1,
            p: 2,
            overflowY: 'auto',
            bgcolor: 'action.hover',
            minHeight: 200
          }}
        >
          {blocks.length === 0 ? (
            <Box
              sx={{
                height: '100%',
                minHeight: 150,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: 'background.default',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s',
                '&:hover': disabled ? {} : {
                  borderColor: `${containerColor}.main`,
                  bgcolor: 'action.hover'
                }
              }}
              onClick={disabled ? undefined : (e: any) => handleAddClick(e)}
            >
              <AddIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Clicca per aggiungere un blocco
              </Typography>
              <Typography variant="caption" color="text.disabled">
                Ramo {containerLabel}
              </Typography>
            </Box>
          ) : (
            <Stack spacing={1.5}>
              {blocks.map((block, index) => (
                <Fade in key={block.id}>
                  <Box
                    draggable={!disabled}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    sx={{
                      position: 'relative',
                      cursor: disabled ? 'default' : 'move',
                      opacity: draggedIndex === index ? 0.5 : 1,
                      transition: 'all 0.3s',
                      '&:hover': {
                        '& .drag-handle': { opacity: 1 }
                      }
                    }}
                  >
                    <Paper
                      elevation={1}
                      sx={{
                        p: 1.5,
                        position: 'relative',
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      {/* Drag Handle */}
                      <Box
                        className="drag-handle"
                        sx={{
                          position: 'absolute',
                          left: -8,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          opacity: 0,
                          transition: 'opacity 0.3s',
                          cursor: 'move'
                        }}
                      >
                        <DragIcon color="action" />
                      </Box>

                      {/* Block Actions */}
                      <Box
                        sx={{
                          position: 'absolute',
                          right: 4,
                          top: 4,
                          display: 'flex',
                          gap: 0.5
                        }}
                      >
                        <Tooltip title="Rimuovi blocco">
                          <IconButton
                            size="small"
                            onClick={() => onRemoveBlock(block.id)}
                            disabled={disabled}
                            sx={{
                              opacity: 0.6,
                              '&:hover': { 
                                opacity: 1,
                                color: 'error.main'
                              }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>

                      {/* Block Content */}
                      <Box sx={{ pr: 4 }}>
                        {renderBlock ? (
                          renderBlock(block)
                        ) : (
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              {block.type}
                            </Typography>
                            <Typography variant="body2">
                              Blocco {block.id}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Paper>
                  </Box>
                </Fade>
              ))}
              
              {/* Add button at bottom */}
              <Box sx={{ textAlign: 'center', pt: 1 }}>
                <Button
                  startIcon={<AddIcon />}
                  size="small"
                  onClick={handleAddClick}
                  disabled={disabled}
                  sx={{
                    textTransform: 'none',
                    color: `${containerColor}.main`
                  }}
                >
                  Aggiungi blocco
                </Button>
              </Box>
            </Stack>
          )}
        </Box>
      </Collapse>

      {/* Add Block Menu */}
      <Menu
        anchorEl={addMenuAnchor}
        open={Boolean(addMenuAnchor)}
        onClose={handleAddClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <MenuItem disabled>
          <Typography variant="caption" color="text.secondary">
            Seleziona tipo di blocco
          </Typography>
        </MenuItem>
        <Divider />
        {BLOCK_TYPES.map(blockType => (
          <MenuItem
            key={blockType.value}
            onClick={() => handleBlockTypeSelect(blockType.value)}
          >
            {blockType.label}
          </MenuItem>
        ))}
      </Menu>
    </Paper>
  );
};