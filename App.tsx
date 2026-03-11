import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import QuestionArena from './components/QuestionArena';
import Ranking from './components/Ranking';
import StudyCenter from './components/StudyCenter';
import PastExamArena from './components/PastExamArena';
import BottomNav from './components/BottomNav';
import Login from './components/Login';
import PaywallScreen from './components/PaywallScreen';
import DiagnosticWelcome from './components/DiagnosticWelcome';
import DiagnosticArena from './components/DiagnosticArena';
import DiagnosticResult from './components/DiagnosticResult';
import JourneyMap from './components/JourneyMap';
import JourneyPhaseView from './components/JourneyPhase';
import { View, Exam, DiagnosticAnswer, DiagnosticResult as DiagResultType, JourneyPhase, UserProfile } from './types';
import { supabase } from './services/supabaseClient';
import { hasCompletedDiagnostic, analyzeDiagnosticResults, saveDiagnosticResult } from './services/diagnosticService';
import { initializeJourney } from './services/journeyService';
import { Session } from '@supabase/supabase-js';
import { useSubscription } from './hooks/useSubscription';
import { PaywallOverlay } from './components/PaywallOverlay';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [currentView, setCurrentView] = useState<View>('DASHBOARD');
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [activePhase, setActivePhase] = useState<JourneyPhase | null>(null);
  const [diagnosticResult, setDiagnosticResult] = useState<DiagResultType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPaid, setIsPaid] = useState<boolean | null>(null);
  const [checkingDiagnostic, setCheckingDiagnostic] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const { isPremium, loading: subscriptionLoading } = useSubscription();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Verificar diagnóstico APENAS uma vez (no login inicial)
  const diagnosticChecked = React.useRef(false);
  useEffect(() => {
    if (session?.user && !diagnosticChecked.current) {
      diagnosticChecked.current = true;
      hasCompletedDiagnostic(session.user.id).then(completed => {
        if (!completed && currentView === 'DASHBOARD') {
          setCurrentView('DIAGNOSTIC_WELCOME');
        }
      });
    }
    // Reset quando faz logout
    if (!session) {
      diagnosticChecked.current = false;
    }
  }, [session]);

  // Verificar se o usuário é pagante quando faz login e pegar perfil
  useEffect(() => {
    const checkPayment = async () => {
      if (session?.user) {
        setUserProfile({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || '',
          created_at: session.user.created_at
        });

        const { data, error } = await supabase
          .from('profiles')
          .select('is_paid')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Erro ao verificar pagamento:', error);
          setIsPaid(false);
        } else {
          setIsPaid(data?.is_paid ?? false);
        }
      } else {
        setIsPaid(null);
        setUserProfile(null);
      }
    };
    checkPayment();
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return <div className="bg-background-dark min-h-screen"></div>;
  }

  if (!session) {
    return <Login />;
  }

  // Bloquear acesso se não pagou (Temporariamente Desativado para testes PMERJ)
  if (isPaid === null) {
    return <div className="bg-background-dark min-h-screen flex items-center justify-center"><span className="text-white">Verificando acesso...</span></div>;
  }

  // if (!isPaid) {
  //   return <PaywallScreen userEmail={session.user.email} onLogout={handleLogout} />;
  // }

  const handleSelectExam = (exam: Exam) => {
    setActiveExam(exam);
    setCurrentView('PAST_EXAM_PRACTICE');
  };

  const handleFinishExam = () => {
    setActiveExam(null);
    setCurrentView('STUDY_CENTER');
  };

  // Diagnóstico: iniciar
  const handleStartDiagnostic = () => {
    setCurrentView('DIAGNOSTIC_ARENA');
  };

  // Diagnóstico: completar
  const handleDiagnosticComplete = async (answers: DiagnosticAnswer[]) => {
    const result = analyzeDiagnosticResults(answers);
    setDiagnosticResult(result);

    // Salvar no banco
    if (session?.user) {
      await saveDiagnosticResult(session.user.id, result);
      // Inicializar a jornada com os tópicos fracos
      await initializeJourney(session.user.id, result.weakTopics);
    }

    setCurrentView('DIAGNOSTIC_RESULT');
  };

  // Jornada: começar após diagnóstico
  const handleStartJourney = () => {
    setCurrentView('JOURNEY_MAP');
  };

  // Jornada: selecionar fase
  const handleSelectPhase = (phase: JourneyPhase) => {
    setActivePhase(phase);
    setCurrentView('JOURNEY_PHASE');
  };

  // Jornada: voltar para o mapa
  const handleBackToMap = () => {
    setActivePhase(null);
    setCurrentView('JOURNEY_MAP');
  };

  // Jornada: fase completa
  const handlePhaseComplete = () => {
    setActivePhase(null);
    setCurrentView('JOURNEY_MAP');
  };

  // Esconder BottomNav durante diagnóstico e fases da jornada
  const hideBottomNav = ['DIAGNOSTIC_WELCOME', 'DIAGNOSTIC_ARENA', 'DIAGNOSTIC_RESULT', 'JOURNEY_PHASE', 'PAST_EXAM_PRACTICE'].includes(currentView);

  const renderView = () => {
    switch (currentView) {
      case 'DASHBOARD':
        return <Dashboard setView={setCurrentView} />;
      case 'PRACTICE':
        if (subscriptionLoading) {
          return <div className="flex justify-center items-center h-full"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
        }
        if (!isPremium) {
          return (
            <div className="relative h-full overflow-hidden bg-slate-50 dark:bg-slate-900/50">
              {/* Blurred background mock */}
              <div className="absolute inset-0 blur-md opacity-40 pointer-events-none p-6 space-y-4">
                <div className="h-32 bg-white dark:bg-slate-800 rounded-xl w-full"></div>
                <div className="h-16 bg-white dark:bg-slate-800 rounded-xl w-full"></div>
                <div className="h-16 bg-white dark:bg-slate-800 rounded-xl w-full"></div>
              </div>
              <PaywallOverlay userProfile={userProfile} featureName="Treinador Infinito" />
            </div>
          );
        }
        return <QuestionArena />;
      case 'RANKING':
        return <Ranking />;
      case 'STUDY_CENTER':
        return <StudyCenter onSelectExam={handleSelectExam} setView={setCurrentView} userProfile={userProfile} />;
      case 'PAST_EXAM_PRACTICE':
        return activeExam ? <PastExamArena exam={activeExam} onFinishExam={handleFinishExam} /> : <StudyCenter onSelectExam={handleSelectExam} setView={setCurrentView} userProfile={userProfile} />;
      case 'DIAGNOSTIC_WELCOME':
        return <DiagnosticWelcome onStart={handleStartDiagnostic} />;
      case 'DIAGNOSTIC_ARENA':
        return <DiagnosticArena onComplete={handleDiagnosticComplete} />;
      case 'DIAGNOSTIC_RESULT':
        return diagnosticResult ? <DiagnosticResult result={diagnosticResult} onStartJourney={handleStartJourney} /> : <Dashboard setView={setCurrentView} />;
      case 'JOURNEY_MAP':
        return <JourneyMap onSelectPhase={handleSelectPhase} />;
      case 'JOURNEY_PHASE':
        return activePhase ? <JourneyPhaseView phase={activePhase} onBack={handleBackToMap} onPhaseComplete={handlePhaseComplete} /> : <JourneyMap onSelectPhase={handleSelectPhase} />;
      default:
        return <Dashboard setView={setCurrentView} />;
    }
  };

  return (
    <div className="w-full h-full bg-background-light dark:bg-background-dark font-display">
      <div className="max-w-screen-xl mx-auto flex flex-col relative h-full">
        <main className="flex-1 overflow-y-auto">
          {renderView()}
        </main>
        {!hideBottomNav && <BottomNav currentView={currentView} setView={setCurrentView} />}
      </div>
    </div>
  );
};

export default App;
