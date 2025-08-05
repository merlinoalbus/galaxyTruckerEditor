import { useMemo } from 'react';

interface ElementCount {
  scripts: number;
  nodes: number;
  connections: number;
  missions: number;
  variables: number;
}

export const useElementCounters = (data: {
  scripts?: any[];
  nodes?: any[];
  connections?: any[];
  missions?: any[];
  variables?: any[];
}): ElementCount => {
  const counts = useMemo(() => ({
    scripts: data.scripts?.length || 0,
    nodes: data.nodes?.length || 0,
    connections: data.connections?.length || 0,
    missions: data.missions?.length || 0,
    variables: data.variables?.length || 0
  }), [data]);

  return counts;
};