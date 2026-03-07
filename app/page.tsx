import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">
          Smart AI Cataloging
        </h1>
        <p className="text-text-secondary text-lg mb-8">
          AI-powered inventory management and product cataloging
        </p>
        <div className="flex gap-4 justify-center">
          <Link 
            href="/login"
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Login
          </Link>
          <Link 
            href="/dashboard"
            className="px-6 py-3 bg-surface-elevated text-text-primary rounded-lg hover:bg-surface-elevated/80 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
