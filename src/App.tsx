import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { OnboardingProvider } from './state/onboarding';
import { Welcome } from './screens/Welcome';
import { Symptoms } from './screens/Symptoms';
import { Question } from './screens/Question';
import { StartingScore } from './screens/StartingScore';
import { PickPatches } from './screens/PickPatches';
import { SprintReady } from './screens/SprintReady';
import { Styleguide } from './screens/Styleguide';

export function App() {
  return (
    <OnboardingProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/symptoms" element={<Symptoms />} />
          <Route path="/question/:area" element={<Question />} />
          <Route path="/score" element={<StartingScore />} />
          <Route path="/patches" element={<PickPatches />} />
          <Route path="/ready" element={<SprintReady />} />
          <Route path="/styleguide" element={<Styleguide />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </OnboardingProvider>
  );
}
