import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './router';
import Header from './components/feature/Header';
import Footer from './components/feature/Footer';

function App() {
  return (
    <BrowserRouter basename={__BASE_PATH__}>
      <Header />
      <AppRoutes />
      <Footer />
    </BrowserRouter>
  );
}

export default App;
