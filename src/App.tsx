import { Authenticator } from '@aws-amplify/ui-react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { MatchesPage } from './pages/MatchesPage';
import { ProfilePage } from './pages/ProfilePage';
import { RequestsPage } from './pages/RequestsPage';

function App() {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <BrowserRouter>
          <nav className="app-nav">
            <div className="app-nav-links">
              <Link to="/">Matches</Link>
              <Link to="/requests">My requests</Link>
              <Link to="/profile">Profile</Link>
            </div>
            <div className="app-nav-user">
              <span className="muted">{user?.signInDetails?.loginId}</span>
              <button type="button" onClick={signOut}>
                Sign out
              </button>
            </div>
          </nav>
          <main className="app-main">
            <Routes>
              <Route path="/" element={<MatchesPage />} />
              <Route path="/requests" element={<RequestsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Routes>
          </main>
        </BrowserRouter>
      )}
    </Authenticator>
  );
}

export default App;
