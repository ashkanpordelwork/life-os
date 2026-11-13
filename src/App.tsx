import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { lazy, Suspense, type ReactNode } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { OnboardingProvider } from './state/onboarding';
import { SessionProvider, useSession } from './state/session';
import { motionTokens } from './styles/motion';
import { Welcome } from './screens/Welcome';
import { Symptoms } from './screens/Symptoms';
import { Question } from './screens/Question';
import { StartingScore } from './screens/StartingScore';
import { PickPatches } from './screens/PickPatches';
import { SprintReady } from './screens/SprintReady';
import { Login, Signup } from './screens/Auth';
import { Today } from './screens/Today';
import { PatchDetail } from './screens/PatchDetail';
import { Done } from './screens/Done';
import { You } from './screens/You';
const Styleguide = lazy(() => import('./screens/Styleguide').then((m) => ({ default: m.Styleguide })));

/** Screens that need a logged-in user. */
function RequireUser({ children }: { children: ReactNode }) {
  const { ready, user } = useSession();
  if (!ready) return null;
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

/** Logged-in users skip Log in / Create account. */
function GuestOnly({ children }: { children: ReactNode }) {
  const { ready, user } = useSession();
  if (!ready) return null;
  return user ? <Navigate to="/today" replace /> : <>{children}</>;
}

/** Each screen fades and slides in a little; the old one fades out quickly. */
function Page({ children }: { children: ReactNode }) {
  return (
    <motion.div
      className="page"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0, transition: motionTokens.page }}
      exit={{ opacity: 0, transition: motionTokens.pageExit }}
    >
      {children}
    </motion.div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  const page = (el: ReactNode) => <Page>{el}</Page>;
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={page(<Welcome />)} />
        <Route path="/symptoms" element={page(<Symptoms />)} />
        <Route path="/question/:area" element={page(<Question />)} />
        <Route path="/score" element={page(<StartingScore />)} />
        <Route path="/patches" element={page(<PickPatches />)} />
        <Route path="/ready" element={page(<SprintReady />)} />
        <Route path="/login" element={page(<GuestOnly><Login /></GuestOnly>)} />
        <Route path="/signup" element={page(<GuestOnly><Signup /></GuestOnly>)} />
        <Route path="/today" element={page(<RequireUser><Today /></RequireUser>)} />
        <Route path="/patch/:id" element={page(<RequireUser><PatchDetail /></RequireUser>)} />
        <Route path="/done" element={page(<RequireUser><Done /></RequireUser>)} />
        <Route path="/you" element={page(<RequireUser><You /></RequireUser>)} />
        <Route path="/styleguide" element={<Suspense fallback={null}><Styleguide /></Suspense>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <OnboardingProvider>
        <SessionProvider>
          <HashRouter>
            <AnimatedRoutes />
          </HashRouter>
        </SessionProvider>
      </OnboardingProvider>
    </MotionConfig>
  );
}
