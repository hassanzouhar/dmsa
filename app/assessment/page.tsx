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
import { ArrowLeft, ArrowRight, BarChart3, CheckCircle2, AlertCircle, Save, Cloud } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AssessmentPage() {
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Store state and actions
  const {
    spec,
    answers,
    setSpec,
    currentQuestionIndex,
    nextQuestion,
    previousQuestion,
    setCurrentQuestionIndex,
    isLoading,
    error,
    isCompleted
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
  
  // Initialize the assessment spec
  useEffect(() => {
    if (!spec && !isLoading) {
      setSpec(dmaNo_v1);
      setIsInitialized(true);
    }
  }, [spec, isLoading, setSpec]);

  // Get current dimension info
  const currentDimension = spec?.dimensions.find(d => 
    d.id === currentQuestion?.dimensionId
  );

  // Navigation handlers
  const handleNext = () => {
    if (spec && currentQuestionIndex < spec.questions.length - 1) {
      nextQuestion();
    } else if (isCompleted) {
      // Navigate to results if assessment is complete
      router.push('/results');
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      previousQuestion();
    }
  };

  const handleGoToResults = () => {
    router.push('/results');
  };

  // Question navigation (for jumping to specific questions)
  const handleQuestionSelect = (index: number) => {
    setCurrentQuestionIndex(index);
  };

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
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold text-primary">
                    Digital Modenhetsvurdering (DMA)
                  </CardTitle>
                  <CardDescription>
                    Vurder din bedrifts digitale modenhet på 6 nøkkeldimensjoner
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-sm">
                    {currentQuestionIndex + 1} av {spec.questions.length}
                  </Badge>
                  {isCompleted && (
                    <Badge variant="default" className="text-sm bg-green-600">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Fullført
                    </Badge>
                  )}
                  
                  {/* Auto-save indicator */}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {isSaving ? (
                      <>
                        <Save className="w-3 h-3 animate-pulse" />
                        <span>Lagrer...</span>
                      </>
                    ) : lastSaved ? (
                      <>
                        <Cloud className="w-3 h-3 text-green-600" />
                        <span>Auto-lagret {lastSaved.toLocaleTimeString('no-NO', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}</span>
                      </>
                    ) : (
                      <>
                        <Cloud className="w-3 h-3" />
                        <span>Auto-lagring aktivert</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Progress bar */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Fremgang</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="w-full h-3" />
                
                {/* Dimension progress indicators */}
                <div className="grid grid-cols-6 gap-1 mt-2">
                  {spec.dimensions.map((dimension, index) => {
                    const dimensionQuestions = spec.questions.filter(q => q.dimensionId === dimension.id);
                    const answeredQuestions = dimensionQuestions.filter(q => answers[q.id] !== undefined);
                    const dimensionProgress = (answeredQuestions.length / dimensionQuestions.length) * 100;
                    
                    return (
                      <div key={dimension.id} className="text-center">
                        <div className={`h-2 rounded-full ${
                          dimensionProgress === 100 ? 'bg-green-500' :
                          dimensionProgress > 0 ? 'bg-blue-500' : 'bg-gray-200'
                        }`} style={{ width: `${dimensionProgress}%` }}></div>
                        <span className="text-xs text-muted-foreground mt-1 block">
                          D{index + 1}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

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

          {/* Navigation */}
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={!canGoPrevious}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Forrige</span>
                </Button>

                <div className="flex items-center space-x-2">
                  {/* Question dots for navigation */}
                  <div className="hidden md:flex items-center space-x-1">
                    {spec.questions.slice(0, 11).map((q, index) => {
                      const isAnswered = useAssessmentStore.getState().answers[q.id];
                      const isCurrent = index === currentQuestionIndex;
                      
                      return (
                        <button
                          key={q.id}
                          onClick={() => handleQuestionSelect(index)}
                          className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${
                            isCurrent
                              ? 'bg-primary text-white ring-2 ring-primary/30'
                              : isAnswered
                              ? 'bg-green-100 text-green-700 border border-green-200'
                              : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
                          }`}
                          title={`Spørsmål ${index + 1}: ${q.title.substring(0, 50)}...`}
                        >
                          {index + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {isLastQuestion && isCompleted && (
                    <Button
                      onClick={handleGoToResults}
                      className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span>Se resultater</span>
                    </Button>
                  )}
                  
                  <Button
                    onClick={handleNext}
                    disabled={!canGoNext}
                    className="flex items-center space-x-2"
                  >
                    <span>{isLastQuestion ? 'Fullfør' : 'Neste'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress summary */}
          <Card className="border-0 shadow-sm bg-muted/30">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">{spec.questions.length}</div>
                  <div className="text-sm text-muted-foreground">Totale spørsmål</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {Object.keys(useAssessmentStore.getState().answers).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Besvarte</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{spec.dimensions.length}</div>
                  <div className="text-sm text-muted-foreground">Dimensjoner</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{Math.round(progress)}%</div>
                  <div className="text-sm text-muted-foreground">Fullført</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}