'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { readPracticeResult, type PracticeResultData } from '../../../lib/practice/resultData';
import { ResultScreen } from '../../../components/practice/ResultScreen';
import '../../../components/practice/practice.css';

export default function PracticeResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<PracticeResultData | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const data = readPracticeResult();
    if (!data) {
      router.replace('/');
      return;
    }
    setResult(data);
    setIsLoaded(true);
  }, []);

  if (!isLoaded || !result) {
    return (
      <div className="practice-shell practice-loading-container">
        <p className="t-body">Загрузка...</p>
      </div>
    );
  }

  return <ResultScreen result={result} />;
}
