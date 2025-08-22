import React from 'react';
import { render } from '@testing-library/react';
import { AchievementAvatar } from '../AchievementAvatar';
import { AchievementsImagesProvider } from '@/contexts/AchievementsImagesContext';

// Mock del context
const MockAchievementsImagesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const mockContextValue = {
    achievements: [
      {
        name: 'test-achievement',
        postImagePath: 'test-image.png',
        imageUrl: 'data:image/png;base64,test'
      }
    ],
    loading: false,
    error: null,
    refresh: jest.fn()
  };

  return (
    <div data-testid="mock-achievements-context">
      {React.cloneElement(children as React.ReactElement, {
        useAchievementsImages: () => mockContextValue
      })}
    </div>
  );
};

describe('AchievementAvatar', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <MockAchievementsImagesProvider>
        <AchievementAvatar achievementName="test-achievement" />
      </MockAchievementsImagesProvider>
    );
    expect(container.firstChild).toBeTruthy();
  });

  it('renders with different sizes', () => {
    const { rerender, container } = render(
      <MockAchievementsImagesProvider>
        <AchievementAvatar achievementName="test-achievement" size="small" />
      </MockAchievementsImagesProvider>
    );
    expect(container.querySelector('.h-10')).toBeTruthy();

    rerender(
      <MockAchievementsImagesProvider>
        <AchievementAvatar achievementName="test-achievement" size="large" />
      </MockAchievementsImagesProvider>
    );
    expect(container.querySelector('.h-24')).toBeTruthy();
  });

  it('renders default star icon when no achievement found', () => {
    const { container } = render(
      <MockAchievementsImagesProvider>
        <AchievementAvatar achievementName="non-existent-achievement" />
      </MockAchievementsImagesProvider>
    );
    
    const img = container.querySelector('img');
    expect(img).toBeTruthy();
    expect(img?.src).toContain('data:image/svg+xml');
  });
});
