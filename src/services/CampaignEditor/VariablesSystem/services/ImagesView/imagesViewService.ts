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
      
      const response = await fetch(`${API_BASE_URL}/images?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
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
        headers: {
          'Content-Type': 'application/json',
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