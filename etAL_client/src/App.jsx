import Navbar from "./components/searchFunctions/Navbar";
import ActionBar from "./components/action_bar/ActionBar";
import FooterBar from "./components/footer/FooterBar";
import NetworkGraph from "./components/citation_visualization/NetworkGraph";
import NetworkLoadingOverlay from "./components/citation_visualization/NetworkLoadingOverlay";
import NetworkMenus from "./components/citation_visualization/NetworkMenus";
import SelectedArticleViewBox from "./components/selected_article/SelectedArticleViewBox";
import WelcomeScreen from "./components/welcome/WelcomeScreen";
import NetworkGraphProvider from "./contexts/NetworkGraphProvider";
import WorkspaceProvider from "./contexts/WorkspaceProvider";
import useNetworkGraphContext from "./hooks/useNetworkGraphContext";

function AppContent() {
  const { data, loading, loadingPhase, timeToLoadMS } = useNetworkGraphContext();
  const hasGraph = data !== null;

  return (
    <div className="appShell">
      {hasGraph && <Navbar />}
      <main className="visualizerShell">
        {hasGraph ? (
          <NetworkGraph />
        ) : (
          <WelcomeScreen />
        )}
      </main>
      {hasGraph && <FooterBar />}
      {hasGraph && <NetworkMenus />}
      {hasGraph && <ActionBar />}
      {hasGraph && <SelectedArticleViewBox />}
      {loading && (
        <NetworkLoadingOverlay
          estimatedLoadingTimeMS={timeToLoadMS}
          loadingPhase={loadingPhase}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <NetworkGraphProvider>
      <WorkspaceProvider>
        <AppContent />
      </WorkspaceProvider>
    </NetworkGraphProvider>
  );
}

export default App;
