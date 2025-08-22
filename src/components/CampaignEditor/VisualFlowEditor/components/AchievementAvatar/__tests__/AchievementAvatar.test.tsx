import React from 'react';
import { render } from '@testing-library/react';
import { AchievementAvatar } from '../AchievementAvatar';
import { AchievementsImagesContext } from '@/contexts/AchievementsImagesContext';

// Helper per wrappare con un Provider reale del contesto
const withMockAchievementsProvider = (ui: React.ReactElement, ctx?: Partial<React.ContextType<typeof AchievementsImagesContext>>) => {
  const value = {
    achievements: [
      {
        name: 'test-achievement',
        postImagePath: 'test-image.png',
        imageUrl: 'data:image/png;base64,test'
      }
    ],
    loading: false,
    error: null,
    refresh: jest.fn(),
    ...ctx,
  } as NonNullable<React.ContextType<typeof AchievementsImagesContext>>;

  return (
    <AchievementsImagesContext.Provider value={value}>
      {ui}
    </AchievementsImagesContext.Provider>
  );
};

describe('AchievementAvatar', () => {
  it('renders without crashing', () => {
    const { container } = render(
      withMockAchievementsProvider(<AchievementAvatar achievementName="test-achievement" />)
    );
    expect(container.firstChild).toBeTruthy();
  });

  it('renders with different sizes', () => {
    const { rerender, container } = render(
      withMockAchievementsProvider(<AchievementAvatar achievementName="test-achievement" size="small" />)
    );
    expect(container.querySelector('.h-10')).toBeTruthy();

    rerender(
      withMockAchievementsProvider(<AchievementAvatar achievementName="test-achievement" size="large" />)
    );
    expect(container.querySelector('.h-24')).toBeTruthy();
  });

  it('renders default star icon when no achievement found', () => {
    const { container } = render(
      withMockAchievementsProvider(<AchievementAvatar achievementName="non-existent-achievement" />)
    );
    
    const img = container.querySelector('img');
    expect(img).toBeTruthy();
    expect(img?.src).toContain('data:image/svg+xml');
  });
});
