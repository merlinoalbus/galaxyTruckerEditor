/**
 * Test per la validazione dei parametri di SETFOCUS e RESETFOCUS
 */

import { validateBlockParameters } from '../hooks/CampaignEditor/VisualFlowEditor/blockManipulation/validation/parameterValidation';
import type { IFlowBlock } from '../types/CampaignEditor/VisualFlowEditor/blocks.types';

describe('SETFOCUS e RESETFOCUS validation', () => {
  
  describe('SETFOCUS validation', () => {
    it('dovrebbe essere valido quando ha il parametro button', () => {
      const block: IFlowBlock = {
        id: 'test-setfocus',
        type: 'SETFOCUS',
        position: { x: 0, y: 0 },
        parameters: {
          button: 'testButton'
        }
      };

      const result = validateBlockParameters(block);
      expect(result.valid).toBe(true);
    });

    it('dovrebbe essere invalido quando non ha il parametro button', () => {
      const block: IFlowBlock = {
        id: 'test-setfocus',
        type: 'SETFOCUS',
        position: { x: 0, y: 0 },
        parameters: {}
      };

      const result = validateBlockParameters(block);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('SETFOCUS_NO_BUTTON');
    });

    it('dovrebbe essere invalido quando il parametro button è stringa vuota', () => {
      const block: IFlowBlock = {
        id: 'test-setfocus',
        type: 'SETFOCUS',
        position: { x: 0, y: 0 },
        parameters: {
          button: ''
        }
      };

      const result = validateBlockParameters(block);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('SETFOCUS_NO_BUTTON');
    });

    it('dovrebbe essere invalido quando il parametro button è solo whitespace', () => {
      const block: IFlowBlock = {
        id: 'test-setfocus',
        type: 'SETFOCUS',
        position: { x: 0, y: 0 },
        parameters: {
          button: '   '
        }
      };

      const result = validateBlockParameters(block);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('SETFOCUS_NO_BUTTON');
    });
  });

  describe('RESETFOCUS validation', () => {
    it('dovrebbe essere valido quando ha il parametro button', () => {
      const block: IFlowBlock = {
        id: 'test-resetfocus',
        type: 'RESETFOCUS',
        position: { x: 0, y: 0 },
        parameters: {
          button: 'testButton'
        }
      };

      const result = validateBlockParameters(block);
      expect(result.valid).toBe(true);
    });

    it('dovrebbe essere invalido quando non ha il parametro button', () => {
      const block: IFlowBlock = {
        id: 'test-resetfocus',
        type: 'RESETFOCUS',
        position: { x: 0, y: 0 },
        parameters: {}
      };

      const result = validateBlockParameters(block);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('RESETFOCUS_NO_BUTTON');
    });

    it('dovrebbe essere invalido quando il parametro button è stringa vuota', () => {
      const block: IFlowBlock = {
        id: 'test-resetfocus',
        type: 'RESETFOCUS',
        position: { x: 0, y: 0 },
        parameters: {
          button: ''
        }
      };

      const result = validateBlockParameters(block);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('RESETFOCUS_NO_BUTTON');
    });

    it('dovrebbe essere invalido quando il parametro button è solo whitespace', () => {
      const block: IFlowBlock = {
        id: 'test-resetfocus',
        type: 'RESETFOCUS',
        position: { x: 0, y: 0 },
        parameters: {
          button: '   '
        }
      };

      const result = validateBlockParameters(block);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('RESETFOCUS_NO_BUTTON');
    });
  });
});
