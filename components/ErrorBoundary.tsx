'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center p-5">
            <div className="border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-center max-w-md">
              <div className="text-xl font-extrabold mb-3">Something went wrong</div>
              <div className="text-sm font-semibold text-gray-600 mb-4">
                Please refresh the page or try again later.
              </div>
              <button
                onClick={() => window.location.reload()}
                className="bg-black border-4 border-black py-3 px-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                <div className="text-white text-sm font-extrabold tracking-wide">
                  RELOAD PAGE
                </div>
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}





