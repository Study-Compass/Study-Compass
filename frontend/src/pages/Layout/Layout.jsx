import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom'; // Allows for nested routes to be rendered within this layout
import Banner from '../../components/Banner/Banner'; // Import your Banner component

function Layout() {
  const [visible, setVisible] = useState(false);

  const [viewport, setViewport] = useState("100vh");
  useEffect(() => {
      let height = window.innerHeight;
      setViewport(height + 'px');
      //add listener
  },[]);
  
  return (
    <div style={{height:viewport}}>
      {/* The Banner is rendered here and will appear across all pages */}
      <Banner visible={visible} setVisible={setVisible} bannerType="default" />
      
      {/* This will render the content of the page (children) */}
      <main>
        <div className="out" >

          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default Layout;
