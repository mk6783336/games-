import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { SiteLayout } from "./components/SiteChrome";
import { capturePageview } from "./lib/analytics";
import Account from "./pages/Account";
import Challenges from "./pages/Challenges";
import Cycle from "./pages/Cycle";
import GameDetail from "./pages/GameDetail";
import Games from "./pages/Games";
import Home from "./pages/Home";
import ImpossibleRoom from "./pages/ImpossibleRoom";
import InfoPage from "./pages/InfoPage";
import Leaderboard from "./pages/Leaderboard";
import NotFound from "./pages/NotFound";
import OneChance from "./pages/OneChance";
import Profile from "./pages/Profile";

function PageviewTracker() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    capturePageview(pathname + search);
  }, [pathname, search]);

  return null;
}

export default function App() {
  return (
    <>
      <PageviewTracker />
      <Routes>
        <Route element={<SiteLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/games" element={<Games />} />
          <Route path="/games/:gameId" element={<GameDetail />} />
          <Route path="/challenges" element={<Challenges />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/account" element={<Account />} />
          <Route path="/support" element={<InfoPage kind="support" />} />
          <Route path="/privacy" element={<InfoPage kind="privacy" />} />
          <Route path="/terms" element={<InfoPage kind="terms" />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="/play/impossible-room" element={<ImpossibleRoom />} />
        <Route path="/play/one-chance" element={<OneChance />} />
        <Route path="/play/cycle" element={<Cycle />} />
      </Routes>
    </>
  );
}
