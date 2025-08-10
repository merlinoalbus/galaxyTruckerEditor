import React, { useState, useCallback } from 'react';
import { Box, Typography, Select, MenuItem, TextField, FormControlLabel, Checkbox, Stack, Divider, Paper } from '@mui/material';
import { BaseBlock, Block } from '../../../../../../../types/CampaignEditor/VisualFlowEditor/BlockTypes';

interface IfBlock extends BaseBlock {
  type: 'IF';
  ifType: 'IF' | 'IFNOT' | 'IF_DEBUG' | 'IF_FROM_CAMPAIGN' | 'IF_HAS_CREDITS' | 
          'IF_IS' | 'IF_MAX' | 'IF_MIN' | 'IF_MISSION_WON' | 'IF_ORDER' | 
          'IF_PROB' | 'IF_TUTORIAL_SEEN' | 'IFMISSIONRESULTIS' | 'IFMISSIONRESULTMIN';
  thenBlocks: Block[];
  elseBlocks: Block[];
  variabile?: string;
  valore?: any;
  numThen: number;
  numElse: number;
}

interface IfRendererProps {
  block: IfBlock;
  onUpdate: (updates: Partial<IfBlock>) => void;
  renderBlock?: (block: Block) => React.ReactNode;
  onAddBlock?: (containerId: string, blockType: string) => void;
  onRemoveBlock?: (containerId: string, blockId: string) => void;
}

const IF_TYPES = [
  { value: 'IF', label: 'IF' },
  { value: 'IFNOT', label: 'IF NOT' },
  { value: 'IF_DEBUG', label: 'IF DEBUG' },
  { value: 'IF_FROM_CAMPAIGN', label: 'IF FROM CAMPAIGN' },
  { value: 'IF_HAS_CREDITS', label: 'IF HAS CREDITS' },
  { value: 'IF_IS', label: 'IF IS' },
  { value: 'IF_MAX', label: 'IF MAX' },
  { value: 'IF_MIN', label: 'IF MIN' },
  { value: 'IF_MISSION_WON', label: 'IF MISSION WON' },
  { value: 'IF_ORDER', label: 'IF ORDER' },
  { value: 'IF_PROB', label: 'IF PROBABILITY' },
  { value: 'IF_TUTORIAL_SEEN', label: 'IF TUTORIAL SEEN' },
  { value: 'IFMISSIONRESULTIS', label: 'IF MISSION RESULT IS' },
  { value: 'IFMISSIONRESULTMIN', label: 'IF MISSION RESULT MIN' }
];

export const IfRenderer: React.FC<IfRendererProps> = ({ 
  block, 
  onUpdate, 
  renderBlock,
  onAddBlock,
  onRemoveBlock 
}) => {
  const [hasElse, setHasElse] = useState(block.numElse > 0);
  const [orderValues, setOrderValues] = useState<number[]>(
    Array.isArray(block.valore) ? block.valore : []
  );

  const handleIfTypeChange = useCallback((newType: string) => {
    const updates: Partial<IfBlock> = { 
      ifType: newType as IfBlock['ifType'],
      variabile: undefined,
      valore: undefined
    };

    // Reset values based on type
    if (newType === 'IF_ORDER') {
      updates.valore = [];
    }
    
    onUpdate(updates);
  }, [onUpdate]);

  const handleVariableChange = useCallback((value: string) => {
    onUpdate({ variabile: value });
  }, [onUpdate]);

  const handleValueChange = useCallback((value: any) => {
    onUpdate({ valore: value });
  }, [onUpdate]);

  const handleElseToggle = useCallback((checked: boolean) => {
    setHasElse(checked);
    if (!checked) {
      onUpdate({ 
        elseBlocks: [],
        numElse: 0
      });
    }
  }, [onUpdate]);

  const handleOrderToggle = useCallback((position: number) => {
    const newValues = orderValues.includes(position)
      ? orderValues.filter(v => v !== position)
      : [...orderValues, position];
    
    setOrderValues(newValues);
    onUpdate({ valore: newValues });
  }, [orderValues, onUpdate]);

  const renderParameters = () => {
    switch (block.ifType) {
      case 'IF':
      case 'IFNOT':
        return (
          <TextField
            label="Semaforo"
            value={block.variabile || ''}
            onChange={(e) => handleVariableChange(e.target.value)}
            size="small"
            fullWidth
            sx={{ mt: 1 }}
          />
        );

      case 'IF_IS':
      case 'IF_MAX':
      case 'IF_MIN':
        return (
          <Stack spacing={1} sx={{ mt: 1 }}>
            <TextField
              label="Variabile"
              value={block.variabile || ''}
              onChange={(e) => handleVariableChange(e.target.value)}
              size="small"
              fullWidth
            />
            <TextField
              label="Valore"
              value={block.valore || ''}
              onChange={(e) => handleValueChange(e.target.value)}
              size="small"
              fullWidth
            />
          </Stack>
        );

      case 'IF_PROB':
        return (
          <TextField
            label="Percentuale (%)"
            type="number"
            value={block.valore || ''}
            onChange={(e) => handleValueChange(parseInt(e.target.value))}
            size="small"
            fullWidth
            sx={{ mt: 1 }}
            inputProps={{ min: 0, max: 100 }}
          />
        );

      case 'IF_HAS_CREDITS':
        return (
          <TextField
            label="Crediti"
            type="number"
            value={block.valore || ''}
            onChange={(e) => handleValueChange(parseInt(e.target.value))}
            size="small"
            fullWidth
            sx={{ mt: 1 }}
          />
        );

      case 'IFMISSIONRESULTIS':
        return (
          <TextField
            label="Risultato Missione"
            value={block.valore || ''}
            onChange={(e) => handleValueChange(e.target.value)}
            size="small"
            fullWidth
            sx={{ mt: 1 }}
          />
        );

      case 'IFMISSIONRESULTMIN':
        return (
          <TextField
            label="Risultato Minimo"
            type="number"
            value={block.valore || ''}
            onChange={(e) => handleValueChange(parseInt(e.target.value))}
            size="small"
            fullWidth
            sx={{ mt: 1 }}
          />
        );

      case 'IF_ORDER':
        return (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Posizioni Ordine:
            </Typography>
            <Stack direction="row" spacing={1}>
              {[0, 1, 2, 3].map(position => (
                <FormControlLabel
                  key={position}
                  control={
                    <Checkbox
                      checked={orderValues.includes(position)}
                      onChange={() => handleOrderToggle(position)}
                      size="small"
                    />
                  }
                  label={`${position}`}
                />
              ))}
            </Stack>
          </Box>
        );

      case 'IF_DEBUG':
      case 'IF_FROM_CAMPAIGN':
      case 'IF_MISSION_WON':
      case 'IF_TUTORIAL_SEEN':
        return null;

      default:
        return null;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper elevation={1} sx={{ p: 2, backgroundColor: 'background.paper' }}>
        <Stack spacing={2}>
          {/* Header con tipo IF */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Tipo Condizione
            </Typography>
            <Select
              value={block.ifType}
              onChange={(e) => handleIfTypeChange(e.target.value)}
              size="small"
              fullWidth
            >
              {IF_TYPES.map(type => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </Box>

          {/* Parametri dinamici */}
          {renderParameters()}

          {/* Toggle per Else */}
          <FormControlLabel
            control={
              <Checkbox
                checked={hasElse}
                onChange={(e) => handleElseToggle(e.target.checked)}
              />
            }
            label="Includi ramo ELSE"
          />

          <Divider />

          {/* Container Areas */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            {/* Then Container */}
            <Box sx={{ 
              flex: hasElse ? '1' : '1 1 100%',
              minHeight: 200,
              border: '2px dashed',
              borderColor: 'success.main',
              borderRadius: 1,
              p: 2,
              backgroundColor: 'action.hover'
            }}>
              <Typography variant="subtitle2" color="success.main" gutterBottom>
                THEN ({block.numThen} blocchi)
              </Typography>
              <Stack spacing={1}>
                {block.thenBlocks.map((childBlock) => (
                  <Box key={childBlock.id}>
                    {renderBlock ? renderBlock(childBlock) : (
                      <Paper sx={{ p: 1 }}>
                        <Typography variant="caption">
                          {childBlock.type} - {childBlock.id}
                        </Typography>
                      </Paper>
                    )}
                  </Box>
                ))}
              </Stack>
              {/* Add block button area */}
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'text.secondary',
                    cursor: 'pointer',
                    '&:hover': { color: 'primary.main' }
                  }}
                  onClick={() => onAddBlock?.(`${block.id}-then`, 'DEFAULT')}
                >
                  + Aggiungi blocco
                </Typography>
              </Box>
            </Box>

            {/* Else Container */}
            {hasElse && (
              <Box sx={{ 
                flex: '1',
                minHeight: 200,
                border: '2px dashed',
                borderColor: 'warning.main',
                borderRadius: 1,
                p: 2,
                backgroundColor: 'action.hover'
              }}>
                <Typography variant="subtitle2" color="warning.main" gutterBottom>
                  ELSE ({block.numElse} blocchi)
                </Typography>
                <Stack spacing={1}>
                  {block.elseBlocks.map((childBlock) => (
                    <Box key={childBlock.id}>
                      {renderBlock ? renderBlock(childBlock) : (
                        <Paper sx={{ p: 1 }}>
                          <Typography variant="caption">
                            {childBlock.type} - {childBlock.id}
                          </Typography>
                        </Paper>
                      )}
                    </Box>
                  ))}
                </Stack>
                {/* Add block button area */}
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: 'text.secondary',
                      cursor: 'pointer',
                      '&:hover': { color: 'primary.main' }
                    }}
                    onClick={() => onAddBlock?.(`${block.id}-else`, 'DEFAULT')}
                  >
                    + Aggiungi blocco
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
};