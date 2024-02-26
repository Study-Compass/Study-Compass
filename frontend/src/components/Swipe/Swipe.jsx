import React from 'react';
import { useSpring, animated } from 'react-spring';
import { useDrag } from 'react-use-gesture';

function SwipeablePopup() {
  const [showPopup, setShowPopup] = React.useState(false);
  const [{ y }, set] = useSpring(() => ({ y: 0 }));

  const bind = useDrag(({ down, movement: [, my], distance, cancel }) => {
    // Only start reacting to the movement after a certain threshold to prevent sudden jumps
    const threshold = 10; // Pixels
    const effectiveMovement = Math.abs(my) > threshold ? my - Math.sign(my) * threshold : 0;
  
    if (distance > window.innerHeight * 0.5) {
      setShowPopup(false); // Hide the popup based on the swipe gesture
      cancel();
    }
  
    set({
      y: down ? effectiveMovement : 0,
      immediate: down,
    });
  }, { axis: 'y' });
  if (!showPopup) {
    return <button onClick={() => setShowPopup(true)}>Show Popup</button>;
  }

  return (
    <animated.div
      {...bind()}
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderTop: '1px solid black',
        width: '100%', // Adjusted for full width
        height: '90%',
        transform: y.to(y => `translateY(${y}px)`),
        touchAction: 'none',
      }}
    >
      Swipe to interact with the popup
    </animated.div>
  );
}

export default SwipeablePopup;
