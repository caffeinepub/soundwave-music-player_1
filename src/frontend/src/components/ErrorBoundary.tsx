import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Caught error:", error);
    console.error("[ErrorBoundary] Component stack:", errorInfo.componentStack);
    this.setState({ errorInfo });
  }

  handleReload() {
    window.location.reload();
  }

  render() {
    if (this.state.hasError) {
      const { error, errorInfo } = this.state;
      return (
        <div
          style={{
            minHeight: "100vh",
            backgroundColor: "#121212",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "Inter, sans-serif",
            padding: "24px",
          }}
        >
          <div
            style={{
              maxWidth: "560px",
              width: "100%",
              textAlign: "center",
            }}
          >
            {/* Icon */}
            <div style={{ fontSize: "56px", marginBottom: "16px" }}>🎵</div>

            {/* Heading */}
            <h1
              style={{
                fontSize: "28px",
                fontWeight: 700,
                marginBottom: "8px",
                color: "#ffffff",
              }}
            >
              Something went wrong
            </h1>
            <p
              style={{
                color: "#b3b3b3",
                fontSize: "15px",
                marginBottom: "24px",
                lineHeight: 1.5,
              }}
            >
              Soundwave Pro ran into an unexpected error. Your playback and
              playlists are safe — reload to get back to the music.
            </p>

            {/* Reload button */}
            <button
              type="button"
              data-ocid="error_boundary.primary_button"
              onClick={this.handleReload}
              style={{
                backgroundColor: "#1DB954",
                color: "#000000",
                border: "none",
                borderRadius: "500px",
                padding: "14px 32px",
                fontSize: "15px",
                fontWeight: 700,
                cursor: "pointer",
                marginBottom: "32px",
                transition: "transform 0.15s ease, background-color 0.15s ease",
              }}
            >
              Reload App
            </button>

            {/* Error details */}
            {error && (
              <details
                style={{
                  textAlign: "left",
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #2a2a2a",
                  borderRadius: "8px",
                  padding: "12px 16px",
                }}
              >
                <summary
                  style={{
                    cursor: "pointer",
                    color: "#b3b3b3",
                    fontSize: "13px",
                    userSelect: "none",
                    marginBottom: "8px",
                  }}
                >
                  Error details
                </summary>
                <code
                  style={{
                    display: "block",
                    fontSize: "12px",
                    color: "#ff6b6b",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    fontFamily: "monospace",
                    lineHeight: 1.5,
                  }}
                >
                  {error.toString()}
                  {errorInfo?.componentStack
                    ? `\n\nComponent stack:${errorInfo.componentStack}`
                    : ""}
                </code>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
