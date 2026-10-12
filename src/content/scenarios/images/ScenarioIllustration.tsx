import React from 'react';
import { BusStopScene } from './BusStopScene';
import { DoctorScene } from './DoctorScene';
import { FamilyScene } from './FamilyScene';
import { FlatScene } from './FlatScene';
import { ParkScene } from './ParkScene';
import { ShopScene } from './ShopScene';
import { WorkplaceScene } from './WorkplaceScene';

interface ScenarioIllustrationProps {
  src: string;
  alt: string;
  className?: string;
}

export function ScenarioIllustration({ src, alt, className }: ScenarioIllustrationProps) {
  // Normalize src or filename to find the right scene component
  const normalized = src.toLowerCase().replace(/^\/+/, '').replace(/^scenarios\/images\//, '');

  if (normalized.includes('workplace')) {
    return <WorkplaceScene alt={alt} className={className} />;
  }
  if (normalized.includes('flat')) {
    return <FlatScene alt={alt} className={className} />;
  }
  if (normalized.includes('doctor')) {
    return <DoctorScene alt={alt} className={className} />;
  }
  if (normalized.includes('family')) {
    return <FamilyScene alt={alt} className={className} />;
  }
  if (normalized.includes('shop')) {
    return <ShopScene alt={alt} className={className} />;
  }
  if (normalized.includes('bus-stop') || normalized.includes('busstop')) {
    return <BusStopScene alt={alt} className={className} />;
  }
  if (normalized.includes('park')) {
    return <ParkScene alt={alt} className={className} />;
  }

  // Fallback to img if an unknown external src is passed
  return <img src={src} alt={alt} className={className} />;
}
