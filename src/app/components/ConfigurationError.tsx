import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

interface HelpStep {
  id?: string;
  text: string;
  code?: string;
}

interface ConfigurationErrorProps {
  message: string;
  envVar: string;
  helpSteps?: HelpStep[];
  showHelp?: boolean;
}

/**
 * Configuration error screen for missing or invalid environment variables.
 * Displays actionable instructions with optional development-only help section.
 *
 * @example Usage
 * ```tsx
 * return <ConfigurationError message="Missing env var" envVar="API_KEY" />
 * ```
 */
export function ConfigurationError({
  message,
  envVar,
  helpSteps,
  showHelp = process.env.NODE_ENV === 'development',
}: ConfigurationErrorProps) {
  const defaultHelpSteps: HelpStep[] = [
    { text: 'Create or edit .env.local in your project root', code: '.env.local' },
    { text: `Add: ${envVar}=your_value_here`, code: `${envVar}=your_value_here` },
    { text: 'Get your value from the appropriate service dashboard' },
    { text: 'Restart your development server' },
  ];

  const steps = helpSteps || defaultHelpSteps;

  return (
    <div className={`flex min-h-screen flex-col items-center justify-center p-8 text-center ${inter.className}`}>
      <div className="max-w-2xl rounded-lg border border-red-300 bg-red-50 p-8">
        <h1 className="mb-4 text-2xl font-bold text-red-900">
          Configuration Error
        </h1>
        <p className="mb-4 text-red-800">
          {message}: <code className="rounded bg-red-100 px-2 py-1 text-sm font-mono text-red-900">{envVar}</code>
        </p>
        <p className="text-sm text-red-800">
          Please set this environment variable in your <code className="font-mono">.env.local</code> file and restart the development server.
        </p>
        {showHelp && (
          <details className="mt-4 text-left text-sm">
            <summary className="cursor-pointer font-medium text-red-900 hover:text-red-700">
              How to fix this
            </summary>
            <ol className="mt-2 space-y-1 pl-5 list-decimal text-red-800">
              {steps.map((step, index) => (
                <li key={step.id ?? `${step.text}-${index}`}>
                  {step.text}
                  {step.code && (
                    <code className="ml-1 rounded bg-red-100 px-1.5 py-0.5 text-xs font-mono text-red-900">
                      {step.code}
                    </code>
                  )}
                </li>
              ))}
            </ol>
          </details>
        )}
      </div>
    </div>
  );
}
