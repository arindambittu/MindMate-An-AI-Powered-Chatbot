import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded m-4 h-screen flex flex-col justify-center items-center">
          <div className="max-w-2xl w-full bg-white p-8 rounded-lg shadow-xl">
             <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
             <p className="mb-4">The application crashed with the following error:</p>
             <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto whitespace-pre-wrap font-mono border border-gray-300">
                {this.state.error?.toString()}
             </pre>
             <button 
                 onClick={() => window.location.reload()}
                 className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
             >
                 Reload Page
             </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
