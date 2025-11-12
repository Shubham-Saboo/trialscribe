import { useState, useEffect, useCallback } from 'react';
import { ClinicalTrial } from '../types';

const STORAGE_KEY = 'trialscribe_favorites';

export const useFavorites = () => {
  const [favoriteTrials, setFavoriteTrials] = useState<Map<string, ClinicalTrial>>(new Map());

  // Load favorites from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const favoritesArray = JSON.parse(stored);
        const favoritesMap = new Map<string, ClinicalTrial>();
        favoritesArray.forEach((trial: ClinicalTrial) => {
          favoritesMap.set(trial.nct_id, trial);
        });
        setFavoriteTrials(favoritesMap);
      } catch (e) {
        console.error('Failed to load favorites:', e);
        // Clear corrupted data
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const toggleFavorite = useCallback((trial: ClinicalTrial) => {
    setFavoriteTrials(prev => {
      const newFavorites = new Map(prev);
      if (newFavorites.has(trial.nct_id)) {
        newFavorites.delete(trial.nct_id);
      } else {
        newFavorites.set(trial.nct_id, trial);
      }
      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(newFavorites.values())));
      return newFavorites;
    });
  }, []);

  const isFavorite = useCallback((nctId: string) => {
    return favoriteTrials.has(nctId);
  }, [favoriteTrials]);

  const getFavoriteTrials = useCallback((): ClinicalTrial[] => {
    return Array.from(favoriteTrials.values());
  }, [favoriteTrials]);

  return {
    toggleFavorite,
    isFavorite,
    getFavoriteTrials,
    favoritesCount: favoriteTrials.size,
  };
};

