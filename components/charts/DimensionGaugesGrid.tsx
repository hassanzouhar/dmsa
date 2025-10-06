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
    displayName: 'Digital forretningsstrategi',
    shortDescription: 'Strategisk tilpasning av digitale initiativer med forretningsmål',
    icon: '🎯'
  },
  digitalReadiness: {
    displayName: 'Digital beredskap',
    shortDescription: 'Infrastruktur, kapasiteter og endringsberedskap for digital transformasjon',
    icon: '⚡'
  },
  humanCentric: {
    displayName: 'Menneskesentrisk digitalisering',
    shortDescription: 'Ansattopplevelse, digitale ferdigheter og inkluderende digital design',
    icon: '👥'
  },
  dataManagement: {
    displayName: 'Datastyring og tilkobling',
    shortDescription: 'Datastyring, integrasjon, kvalitet og analysekapasiteter',
    icon: '📊'
  },
  automation: {
    displayName: 'Automatisering og KI',
    shortDescription: 'Prosessautomatisering, kunstig intelligens og intelligente systemer',
    icon: '🤖'
  },
  greenDigitalization: {
    displayName: 'Grønn digitalisering',
    shortDescription: 'Bærekraftige digitale praksiser og miljøansvar',
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