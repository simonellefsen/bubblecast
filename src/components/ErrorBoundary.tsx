"use client";

import { Component, type ReactNode } from "react";
import Link from "next/link";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
          <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-6">
            <h1 className="text-lg font-semibold text-red-900">
              Something went wrong
            </h1>
            <p className="mt-2 text-sm text-red-800">
              {this.state.error.message || "Unexpected client error"}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                className="rounded-full bg-red-700 px-4 py-2 text-sm font-semibold text-white"
                onClick={() => this.setState({ error: null })}
              >
                Try again
              </button>
              <Link
                href="/play"
                className="rounded-full border border-red-200 bg-white px-4 py-2 text-sm text-red-900"
              >
                City map
              </Link>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
