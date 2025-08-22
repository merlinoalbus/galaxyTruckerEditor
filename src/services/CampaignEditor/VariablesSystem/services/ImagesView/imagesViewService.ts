import { logger } from '@/utils/logger';
import { ImagesApiResponse, ImageBinaryResponse } from '@/types/CampaignEditor/VariablesSystem/types/ImagesView/ImagesView.types';
import { IMAGE_CONSTANTS } from '@/constants/Overview.constants';
import { API_CONFIG } from '@/config/constants';

const API_BASE_URL = `${API_CONFIG.API_BASE_URL}`;

class ImagesViewService {
  async getImages(includeThumbnail: boolean = true, thumbnailSize: number = IMAGE_CONSTANTS.DEFAULT_THUMBNAIL_SIZE): Promise<ImagesApiResponse> {
    try {
      const params = new URLSearchParams();
      if (includeThumbnail) {
        params.append('thumbnail', 'true');
        params.append('thumbnailSize', thumbnailSize.toString());
      }
    // Cache-busting per evitare 304/ETag e risposte senza body
    params.append('_', Date.now().toString());
      
      const response = await fetch(`${API_BASE_URL}/images?${params.toString()}`, {
        method: 'GET',
        // Evita 304/ETag e garantisce corpo JSON sempre presente
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
      'If-None-Match': '"force-refresh"'
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
  logger.error('Error fetching images:', error);
      throw error;
    }
  }

  async getImageBinary(percorsi: string[]): Promise<ImageBinaryResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/images/binary`, {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
        body: JSON.stringify({ percorsi }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
  logger.error('Error fetching image binary:', error);
      throw error;
    }
  }

  async getImageFile(percorso: string): Promise<Blob> {
    try {
      const response = await fetch(`${API_BASE_URL}/file/${percorso}`, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      return blob;
    } catch (error) {
  logger.error('Error fetching image file:', error);
      throw error;
    }
  }
}

export const imagesViewService = new ImagesViewService();