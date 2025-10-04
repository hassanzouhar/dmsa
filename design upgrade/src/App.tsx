import React, { useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { CompanyInfoForm } from './components/CompanyInfoForm';
import { AssessmentQuestionnaire } from './components/AssessmentQuestionnaire';
import { ResultsPage } from './components/ResultsPage';
import { LeaderboardPage } from './components/LeaderboardPage';

export interface CompanyInfo {
  name: string;
  industry: string;
  size: 'micro' | 'small' | 'medium' | 'large';
  country: string;
  postalCode: string;
}

export interface AssessmentAnswer {
  questionId: string;
  dimension: string;
  score: number;
}

export interface AssessmentResults {
  dimensionScores: Record<string, number>;
  overallScore: number;
  completedAt: Date;
}

type Step = 'landing' | 'company-info' | 'assessment' | 'results' | 'leaderboard';

export default function App() {
  const [currentStep, setCurrentStep] = useState<Step>('landing');
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [assessmentAnswers, setAssessmentAnswers] = useState<AssessmentAnswer[]>([]);
  const [results, setResults] = useState<AssessmentResults | null>(null);

  const handleStartAssessment = () => {
    setCurrentStep('company-info');
  };

  const handleViewLeaderboard = () => {
    setCurrentStep('leaderboard');
  };

  const handleCompanyInfoSubmit = (info: CompanyInfo) => {
    setCompanyInfo(info);
    setCurrentStep('assessment');
  };

  const handleAssessmentComplete = (answers: AssessmentAnswer[]) => {
    setAssessmentAnswers(answers);
    
    // Calculate results
    const dimensionScores: Record<string, number> = {};
    const dimensions = ['strategy', 'capabilities', 'skills', 'data', 'automation', 'green'];
    
    dimensions.forEach(dimension => {
      const dimensionAnswers = answers.filter(a => a.dimension === dimension);
      const avgScore = dimensionAnswers.reduce((sum, a) => sum + a.score, 0) / dimensionAnswers.length;
      dimensionScores[dimension] = Math.round(avgScore * 10) / 10;
    });
    
    const overallScore = Object.values(dimensionScores).reduce((sum, score) => sum + score, 0) / dimensions.length;
    
    setResults({
      dimensionScores,
      overallScore: Math.round(overallScore * 10) / 10,
      completedAt: new Date()
    });
    
    setCurrentStep('results');
  };

  const handleBackToStart = () => {
    setCurrentStep('landing');
    setCompanyInfo(null);
    setAssessmentAnswers([]);
    setResults(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {currentStep === 'landing' && (
        <LandingPage 
          onStartAssessment={handleStartAssessment}
          onViewLeaderboard={handleViewLeaderboard}
        />
      )}

      {currentStep === 'leaderboard' && (
        <LeaderboardPage onBack={() => setCurrentStep('landing')} />
      )}
      
      {currentStep === 'company-info' && (
        <CompanyInfoForm 
          onSubmit={handleCompanyInfoSubmit}
          onBack={() => setCurrentStep('landing')}
        />
      )}
      
      {currentStep === 'assessment' && companyInfo && (
        <AssessmentQuestionnaire 
          companyInfo={companyInfo}
          onComplete={handleAssessmentComplete}
          onBack={() => setCurrentStep('company-info')}
        />
      )}
      
      {currentStep === 'results' && results && companyInfo && (
        <ResultsPage 
          results={results}
          companyInfo={companyInfo}
          onBackToStart={handleBackToStart}
        />
      )}
    </div>
  );
}