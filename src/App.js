// import logo from './logo.svg';
// import './App.css';

// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.js</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }

// export default App;

import React, { useState } from 'react';
import UserChat from './components/UserChat';
import AdminDashboard from './components/AdminDashboard';

function App() {
  const [mode, setMode] = useState(null); // 'user' or 'admin'

  if (!mode) {
    return (
      <div className="mode-selection">
        <div className="mode-container">
          <h1>💬 Real-Time Chat System</h1>
          <p>Choose your interface</p>
          <div className="mode-buttons">
            <button
              className="mode-btn user-btn"
              onClick={() => setMode('user')}
            >
              <span className="icon">👤</span>
              <span className="label">User Chat</span>
              <span className="desc">Start a support chat</span>
            </button>
            <button
              className="mode-btn admin-btn"
              onClick={() => setMode('admin')}
            >
              <span className="icon">👔</span>
              <span className="label">Admin Dashboard</span>
              <span className="desc">Manage customer chats</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {mode === 'user' ? <UserChat /> : <AdminDashboard />}
    </div>
  );
}

export default App;
