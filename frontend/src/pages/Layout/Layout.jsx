import React, { useState } from 'react';
import { Outlet } from 'react-router-dom'; // Allows for nested routes to be rendered within this layout
import Banner from '../../components/Banner/Banner'; // Import your Banner component

function Layout() {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      {/* The Banner is rendered here and will appear across all pages */}
      <Banner visible={visible} setVisible={setVisible} bannerType="default" />
      
      {/* This will render the content of the page (children) */}
      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
