import Home from '../pages/Home';
import SearchPage from '../pages/SearchPage';
import ArtistPage from '../pages/ArtistPage';
import About from '../pages/About';
import Contact from '../pages/Contact';

export const routes = [
  {
    path: '/',
    element: Home,
    exact: true,
  },
  {
    path: '/search',
    element: SearchPage,
  },
  {
    path: '/artists/:artistId/concerts/:concertId',
    element: ArtistPage,
  },
  {
    path: '/about',
    element: About,
  },
  {
    path: '/contact',
    element: Contact,
  },
];
