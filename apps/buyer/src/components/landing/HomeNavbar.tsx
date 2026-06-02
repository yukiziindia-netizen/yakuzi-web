'use client';

import Navbar from './Navbar';

export default function HomeNavbar() {
  const handleLoginClick = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-login'));
    }
  };

  return <Navbar showUserActions={true} onLoginClick={handleLoginClick} />;
}
