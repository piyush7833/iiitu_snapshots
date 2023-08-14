import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { store,persistor } from './redux/store';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import axios from 'axios';

axios.defaults.baseURL = 'https://vercel.com/piyush7833/iiit-snapshots-backend/AW9eDUP9xy2TsaDD4Ln8Bw4YzoSn'
axios.defaults.withCredentials = true;


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
    <App />
    </PersistGate>
    </Provider>
  </React.StrictMode>
);
