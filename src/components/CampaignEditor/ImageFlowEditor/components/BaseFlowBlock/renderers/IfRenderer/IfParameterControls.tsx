import React from 'react';
import { 
  Box, 
  TextField, 
  Select, 
  MenuItem, 
  FormControlLabel, 
  Checkbox, 
  Stack, 
  Typography,
  Autocomplete,
  Chip
} from '@mui/material';

// Tipi di semafori disponibili
const AVAILABLE_SEMAPHORES = [
  'PLAYER_READY',
  'MISSION_COMPLETE',
  'DIALOGUE_FINISHED',
  'TUTORIAL_DONE',
  'INTRO_PLAYED',
  'CREDITS_SHOWN',
  'GAME_OVER',
  'VICTORY_ACHIEVED',
  'CHECKPOINT_REACHED',
  'CUSTOM_FLAG_1',
  'CUSTOM_FLAG_2',
  'CUSTOM_FLAG_3'
];

// Variabili di gioco disponibili
const GAME_VARIABLES = [
  'playerScore',
  'playerHealth',
  'playerCredits',
  'missionCount',
  'enemiesDefeated',
  'timeElapsed',
  'difficultyLevel',
  'currentWave',
  'bonusPoints',
  'livesRemaining'
];

// Risultati missione possibili
const MISSION_RESULTS = [
  'SUCCESS',
  'FAILURE',
  'PARTIAL',
  'ABANDONED',
  'TIMEOUT',
  'PERFECT'
];

interface IfParameterControlsProps {
  ifType: string;
  variabile?: string;
  valore?: any;
  onVariableChange: (value: string) => void;
  onValueChange: (value: any) => void;
}

export const IfParameterControls: React.FC<IfParameterControlsProps> = ({
  ifType,
  variabile,
  valore,
  onVariableChange,
  onValueChange
}) => {
  
  const renderSemaphoreSelector = () => (
    <Autocomplete
      value={variabile || ''}
      onChange={(_, newValue) => onVariableChange(newValue || '')}
      options={AVAILABLE_SEMAPHORES}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Semaforo"
          size="small"
          placeholder="Seleziona o digita semaforo"
        />
      )}
      freeSolo
      fullWidth
      sx={{ mt: 1 }}
    />
  );

  const renderVariableSelector = () => (
    <Autocomplete
      value={variabile || ''}
      onChange={(_, newValue) => onVariableChange(newValue || '')}
      options={GAME_VARIABLES}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Variabile"
          size="small"
          placeholder="Seleziona o digita variabile"
        />
      )}
      freeSolo
      fullWidth
    />
  );

  const renderValueInput = (label: string, type: 'text' | 'number' = 'text', min?: number, max?: number) => (
    <TextField
      label={label}
      type={type}
      value={valore || ''}
      onChange={(e) => {
        const value = type === 'number' ? 
          (e.target.value ? parseInt(e.target.value) : '') : 
          e.target.value;
        onValueChange(value);
      }}
      size="small"
      fullWidth
      inputProps={type === 'number' ? { min, max } : {}}
    />
  );

  const renderOrderSelector = () => {
    const selectedValues = Array.isArray(valore) ? valore : [];
    
    return (
      <Box sx={{ mt: 1 }}>
        <Typography variant="caption" color="text.secondary" gutterBottom>
          Seleziona posizioni ordine (0 = primo, 3 = ultimo):
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
          {[0, 1, 2, 3].map(position => (
            <FormControlLabel
              key={position}
              control={
                <Checkbox
                  checked={selectedValues.includes(position)}
                  onChange={(e) => {
                    const newValues = e.target.checked
                      ? [...selectedValues, position]
                      : selectedValues.filter(v => v !== position);
                    onValueChange(newValues.sort());
                  }}
                  size="small"
                  color="primary"
                />
              }
              label={
                <Chip
                  label={`Pos ${position}`}
                  size="small"
                  color={selectedValues.includes(position) ? 'primary' : 'default'}
                  variant={selectedValues.includes(position) ? 'filled' : 'outlined'}
                />
              }
            />
          ))}
        </Stack>
      </Box>
    );
  };

  const renderMissionResultSelector = () => (
    <Select
      value={valore || ''}
      onChange={(e) => onValueChange(e.target.value)}
      size="small"
      fullWidth
      displayEmpty
      sx={{ mt: 1 }}
    >
      <MenuItem value="" disabled>
        <em>Seleziona risultato missione</em>
      </MenuItem>
      {MISSION_RESULTS.map(result => (
        <MenuItem key={result} value={result}>
          {result}
        </MenuItem>
      ))}
    </Select>
  );

  const renderProbabilitySlider = () => (
    <Box sx={{ mt: 1 }}>
      <Stack spacing={1}>
        <Typography variant="caption" color="text.secondary">
          Probabilità: {valore || 0}%
        </Typography>
        <TextField
          type="number"
          value={valore || 0}
          onChange={(e) => {
            const val = parseInt(e.target.value) || 0;
            onValueChange(Math.min(100, Math.max(0, val)));
          }}
          size="small"
          fullWidth
          inputProps={{ min: 0, max: 100, step: 5 }}
          InputProps={{
            endAdornment: <Typography variant="caption">%</Typography>
          }}
        />
      </Stack>
    </Box>
  );

  // Rendering basato sul tipo di IF
  switch (ifType) {
    case 'IF':
    case 'IFNOT':
      return renderSemaphoreSelector();

    case 'IF_IS':
    case 'IF_MAX':
    case 'IF_MIN':
      return (
        <Stack spacing={1} sx={{ mt: 1 }}>
          {renderVariableSelector()}
          {renderValueInput('Valore', 'number')}
        </Stack>
      );

    case 'IF_PROB':
      return renderProbabilitySlider();

    case 'IF_HAS_CREDITS':
      return renderValueInput('Quantità Crediti', 'number', 0);

    case 'IFMISSIONRESULTIS':
      return (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Risultato Missione Atteso:
          </Typography>
          {renderMissionResultSelector()}
        </Box>
      );

    case 'IFMISSIONRESULTMIN':
      return renderValueInput('Punteggio Minimo', 'number', 0);

    case 'IF_ORDER':
      return renderOrderSelector();

    case 'IF_DEBUG':
    case 'IF_FROM_CAMPAIGN':
    case 'IF_MISSION_WON':
    case 'IF_TUTORIAL_SEEN':
      return (
        <Box sx={{ mt: 1, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Nessun parametro richiesto per questo tipo di condizione
          </Typography>
        </Box>
      );

    default:
      return null;
  }
};