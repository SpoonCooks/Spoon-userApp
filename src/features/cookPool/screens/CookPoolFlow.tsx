import { useState } from 'react';

import { CookPoolDeckScreen } from './CookPoolDeckScreen';
import { CookPoolScreen } from './CookPoolScreen';
import { CookProfileScreen } from './CookProfileScreen';

/**
 * The Cook Pool end to end in one place — landing, deck and profile — for the dev preview, which
 * runs outside the signed-in stack. The app itself routes between the three
 * (`(app)/cook-pool/*`); the screens are the same.
 */
export interface CookPoolFlowProps {
  readonly onExit: () => void;
}

type Step =
  | { readonly name: 'landing' }
  | { readonly name: 'deck' }
  | {
      readonly name: 'profile';
      readonly cookId: string;
    };

export function CookPoolFlow({ onExit }: CookPoolFlowProps) {
  const [step, setStep] = useState<Step>({ name: 'landing' });
  const toLanding = () => setStep({ name: 'landing' });

  switch (step.name) {
    case 'deck':
      return <CookPoolDeckScreen onDone={toLanding} />;
    case 'profile':
      return <CookProfileScreen cookId={step.cookId} onBack={toLanding} onRemoved={toLanding} />;
    default:
      return (
        <CookPoolScreen
          onBack={onExit}
          onAddCooks={() => setStep({ name: 'deck' })}
          onOpenCook={(cookId) => setStep({ name: 'profile', cookId })}
        />
      );
  }
}
