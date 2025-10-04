'use client';

import React from 'react';
import { DimensionGauge } from './DimensionGauge';

interface DimensionScore {
  id: string;
  score: number;
  target: number;
  gap: number;
}

interface DimensionSpec {
  id: string;
  name: string;
  description?: string;
}

interface DimensionGaugesGridProps {
  dimensions: DimensionScore[];
  dimensionSpecs: DimensionSpec[];
  className?: string;
  showDetails?: boolean;
  compactMode?: boolean;
}

// Dimension display configuration
const dimensionConfig: Record<string, {
  displayName: string;
  shortDescription: string;
  icon?: string;
}> = {
  digitalStrategy: {
    displayName: 'Digital Business Strategy',
    shortDescription: 'Strategic alignment of digital initiatives with business objectives',
    icon: '🎯'
  },
  digitalReadiness: {
    displayName: 'Digital Readiness',
    shortDescription: 'Infrastructure, capabilities, and change readiness for digital transformation',
    icon: '⚡'
  },
  humanCentric: {
    displayName: 'Human-Centric Digitalization',
    shortDescription: 'Employee experience, digital skills, and inclusive digital design',
    icon: '👥'
  },
  dataManagement: {
    displayName: 'Data Management & Connectivity',
    shortDescription: 'Data governance, integration, quality, and analytics capabilities',
    icon: '📊'
  },
  automation: {
    displayName: 'Automation & AI',
    shortDescription: 'Process automation, artificial intelligence, and intelligent systems',
    icon: '🤖'
  },
  greenDigitalization: {
    displayName: 'Green Digitalization',
    shortDescription: 'Sustainable digital practices and environmental responsibility',
    icon: '🌱'
  }
};

export const DimensionGaugesGrid: React.FC<DimensionGaugesGridProps> = ({
  dimensions,
  dimensionSpecs,
  className = '',
  showDetails = true,
  compactMode = false
}) => {
  // Ensure we have all 6 dimensions
  const allDimensionIds = [
    'digitalStrategy',
    'digitalReadiness',
    'humanCentric',
    'dataManagement',
    'automation',
    'greenDigitalization'
  ];

  const enrichedDimensions = allDimensionIds.map(id => {
    const dimensionScore = dimensions.find(d => d.id === id);
    const dimensionSpec = dimensionSpecs.find(d => d.id === id);
    const config = dimensionConfig[id];
    
    return {
      id,
      name: config?.displayName || dimensionSpec?.name || id,
      description: compactMode 
        ? config?.shortDescription 
        : dimensionSpec?.description || config?.shortDescription,
      score: dimensionScore?.score || 0,
      target: dimensionScore?.target,
      gap: dimensionScore?.gap,
      icon: config?.icon
    };
  });

  // Calculate grid layout
  const gridClass = compactMode 
    ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'
    : 'grid grid-cols-1 md:grid-cols-2 gap-6';

  return (
    <div className={`${gridClass} ${className}`}>
      {enrichedDimensions.map((dimension) => (
        <DimensionGauge
          key={dimension.id}
          dimensionId={dimension.id}
          name={dimension.name}
          description={dimension.description}
          score={dimension.score}
          target={dimension.target}
          gap={dimension.gap}
          showDetails={showDetails}
          className={compactMode ? 'h-auto' : ''}
        />
      ))}
    </div>
  );
};

export default DimensionGaugesGrid;