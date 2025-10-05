'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAssessmentStore } from '@/store/assessment';
import { validateAnswers, calculateProgress } from '@/lib/scoring';
import { QuestionRenderer } from '@/components/assessment/QuestionRenderer';
import { dmaNo_v1 } from '@/data/questions.no';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, BarChart3, CheckCircle2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

export default function AssessmentPage() {
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);
  const [companyDetails, setCompanyDetails] = useState<{
    companyName: string;
    naceSector: string;
    companySize: string;
    country: string;
    county?: string;
  } | null>(null);
  // Auto-save state (currently unused but prepared for future implementation)
  const [, setLastSaved] = useState<Date | null>(null);
  const [, setIsSaving] = useState(false);
  
  // Store state and actions
  const {
    spec,
    answers,
    setSpec,
    currentQuestionIndex,
    nextQuestion,
    previousQuestion,
    isLoading,
    error,
    isCompleted,
    surveySession,
    saveResults,
    isSavingResults
  } = useAssessmentStore();
  
  // Auto-save mechanism
  useEffect(() => {
    const saveProgress = async () => {
      if (Object.keys(answers).length > 0) {
        setIsSaving(true);
        // Simulate save delay
        await new Promise(resolve => setTimeout(resolve, 500));
        localStorage.setItem('dma-assessment-progress', JSON.stringify({
          answers,
          timestamp: new Date().toISOString(),
          currentQuestionIndex
        }));
        setLastSaved(new Date());
        setIsSaving(false);
      }
    };
    
    const timeoutId = setTimeout(saveProgress, 2000); // Auto-save after 2 seconds of inactivity
    return () => clearTimeout(timeoutId);
  }, [answers, currentQuestionIndex]);
  
  // Memoized computed state
  const progress = useMemo(() => {
    return spec ? calculateProgress(spec, answers) : 0;
  }, [spec, answers]);
  
  const currentQuestion = useMemo(() => {
    return spec?.questions[currentQuestionIndex] || null;
  }, [spec, currentQuestionIndex]);
  
  const { errors } = useMemo(() => {
    if (!spec) return { errors: [] };
    const validationErrors = validateAnswers(spec, answers);
    return {
      errors: validationErrors
    };
  }, [spec, answers]);
  
  // Initialize the assessment spec and check for company details
  useEffect(() => {
    if (!spec && !isLoading) {
      // Check if we have company details from the previous step
      const storedCompanyDetails = localStorage.getItem('dma-company-details');
      if (!storedCompanyDetails) {
        // Redirect to company details if not present
        router.push('/company-details');
        return;
      }
      
      try {
        const details = JSON.parse(storedCompanyDetails);
        setCompanyDetails(details);
      } catch (error) {
        console.error('Failed to parse company details:', error);
        router.push('/company-details');
        return;
      }
      
      setSpec(dmaNo_v1);
      setIsInitialized(true);
    }
  }, [spec, isLoading, setSpec, router]);

  // Get current dimension info
  const currentDimension = spec?.dimensions.find(d => 
    d.id === currentQuestion?.dimensionId
  );

  // Navigation handlers
  const handleNext = async () => {
    if (spec && currentQuestionIndex < spec.questions.length - 1) {
      nextQuestion();
    } else if (isCompleted) {
      // Save results and navigate
      await handleSaveAndGoToResults();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      previousQuestion();
    }
  };

  const handleGoToResults = async () => {
    await handleSaveAndGoToResults();
  };

  const handleSaveAndGoToResults = async () => {
    if (!surveySession) {
      // If no survey session, just navigate (fallback to legacy)
      router.push('/results');
      return;
    }

    const success = await saveResults();
    if (success) {
      // Navigate to results with the survey session
      router.push(`/results?id=${surveySession.surveyId}&token=${surveySession.retrievalToken}`);
    } else {
      // Still allow navigation even if save failed (user can retry from results page)
      router.push('/results');
    }
  };

  // Question navigation (prepared for future implementation)
  // const handleQuestionSelect = (index: number) => {
  //   setCurrentQuestionIndex(index);
  // };

  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="flex items-center justify-center p-12">
                <div className="text-center space-y-4">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-muted-foreground">Laster digital modenhetsvurdering...</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                En feil oppstod: {error}
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    );
  }

  if (!spec || !currentQuestion) {
    return null;
  }

  const canGoNext = currentQuestionIndex < spec.questions.length - 1 || isCompleted;
  const canGoPrevious = currentQuestionIndex > 0;
  const isLastQuestion = currentQuestionIndex === spec.questions.length - 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <h1 className="text-lg font-semibold truncate hidden md:block">
                  Digital Modenhetsvurdering
                </h1>
                <h1 className="text-lg font-semibold md:hidden">DMA</h1>
                <Badge variant="outline" className="shrink-0">
                  {currentQuestionIndex + 1}/{spec.questions.length} ({Math.round(progress)}%)
                </Badge>
                {isCompleted && (
                  <Badge variant="default" className="bg-green-600 shrink-0 hidden sm:flex">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Fullført
                  </Badge>
                )}
              </div>
              <div className="flex-1 max-w-xs">
                <Progress value={progress} className="h-2" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Current dimension info */}
          {currentDimension && (
            <Card className="border-l-4 border-l-primary bg-primary/5">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    Dimensjon {spec.dimensions.findIndex(d => d.id === currentDimension.id) + 1}
                  </Badge>
                  <CardTitle className="text-lg">{currentDimension.name}</CardTitle>
                </div>
                {currentDimension.description && (
                  <CardDescription className="text-sm">
                    {currentDimension.description}
                  </CardDescription>
                )}
              </CardHeader>
            </Card>
          )}

          {/* Current question */}
          <QuestionRenderer 
            question={currentQuestion}
            className="shadow-md"
          />

          {/* Validation errors */}
          {errors.length > 0 && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <div className="font-medium mb-2">Manglende svar på påkrevde spørsmål:</div>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {errors.map((questionId) => {
                    const question = spec.questions.find(q => q.id === questionId);
                    return (
                      <li key={questionId}>
                        {question ? `${question.id}: ${question.title}` : questionId}
                      </li>
                    );
                  })}
                </ul>
              </AlertDescription>
            </Alert>
            
          )}

          {/* Spacer for sticky footer */}
          <div className="h-24"></div>
        </div>
      </div>

      {/* Sticky Footer Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t shadow-lg z-20">
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={!canGoPrevious}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Forrige</span>
              </Button>

              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {currentQuestionIndex + 1} / {spec.questions.length}
                </span>

                {/* Progress dots for dimensions - desktop only */}
                <div className="hidden md:flex gap-1.5">
                  {spec.dimensions.map((dim) => {
                    const dimQuestions = spec.questions.filter(q => q.dimensionId === dim.id);
                    const completedCount = dimQuestions.filter(q => {
                      const ans = answers[q.id];
                      return ans !== undefined && ans !== null;
                    }).length;
                    const dimProgress = completedCount / dimQuestions.length;

                    return (
                      <div
                        key={dim.id}
                        className={cn(
                          "w-2 h-2 rounded-full transition-all",
                          dimProgress === 1 ? "bg-green-600" :
                          dimProgress > 0 ? "bg-amber-600" :
                          "bg-gray-300"
                        )}
                        title={dim.name}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isLastQuestion && isCompleted && (
                  <Button
                    onClick={handleGoToResults}
                    disabled={isSavingResults}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  >
                    {isSavingResults ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                        <span className="hidden sm:inline">Lagrer...</span>
                      </>
                    ) : (
                      <>
                        <BarChart3 className="w-4 h-4" />
                        <span className="hidden sm:inline">Se resultater</span>
                      </>
                    )}
                  </Button>
                )}

                <Button
                  onClick={handleNext}
                  disabled={!canGoNext || isSavingResults}
                  className="flex items-center gap-2"
                >
                  {isSavingResults && isLastQuestion ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      <span className="hidden sm:inline">Lagrer...</span>
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline">{isLastQuestion ? 'Fullfør' : 'Neste'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
          
