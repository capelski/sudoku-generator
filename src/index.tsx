import React from 'react';
import ReactDOM from 'react-dom';
import { Grid } from './components/grid';

const App = () => <Grid size={9} />;

const appPlaceholder = document.getElementById('app-placeholder');
ReactDOM.render(<App />, appPlaceholder);
