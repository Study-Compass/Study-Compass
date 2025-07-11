import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import defaultAvatar from '../../assets/defaultAvatar.svg';
import useAuth from '../../hooks/useAuth';
import { Icon } from '@iconify-icon/react';
import './Dashboard.scss'

function Dashboard({ menuItems, children, additionalClass = '', middleItem=null, logo, primaryColor, secondaryColor, enableSubSidebar = false} ) {
    const [expanded, setExpanded] = useState(false);
    const [expandedClass, setExpandedClass] = useState("");
    const [currentDisplay, setCurrentDisplay] = useState(0);
    const [navigationStack, setNavigationStack] = useState([]);
    const [currentSubItems, setCurrentSubItems] = useState(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [contentOpacity, setContentOpacity] = useState(1);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [transitionDirection, setTransitionDirection] = useState('right');
    const [showBackButton, setShowBackButton] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState(null);
    const [fakeMenuData, setFakeMenuData] = useState(null);
    
    const [width, setWidth] = useState(window.innerWidth);
    useEffect(() => { //useEffect for window resizing
        function handleResize() {
          setWidth(window.innerWidth);
        }
        window.addEventListener('resize', handleResize);
  
  
        return () => window.removeEventListener('resize', handleResize);
      }, []);

    const {user} = useAuth();

    // Check if menuItems have elements or if we're using the old children pattern
    const hasElementsInMenuItems = menuItems && menuItems.length > 0 && menuItems[0].element;

    useEffect(() => {
        // Get the page from URL parameters, default to 0 if not specified
        const page = parseInt(searchParams.get('page') || '0');
        const sub = searchParams.get('sub');
        
        if (sub !== null) {
            // We're in a sub-menu context
            const subIndex = parseInt(sub);
            if (subIndex >= 0) {
                setCurrentDisplay(subIndex);
            }
        } else if (page >= 0 && page < menuItems.length) {
            // We're in the main menu
            setCurrentDisplay(page);
        }
    }, [searchParams, menuItems.length]);

    // Handle pending navigation after animation completes
    useEffect(() => {
        if (pendingNavigation && !isTransitioning) {
            const { action, data } = pendingNavigation;
            
            if (action === 'subItemClick') {
                setNavigationStack(prev => [...prev, { 
                    parentIndex: data.parentIndex, 
                    subIndex: 0, 
                    items: data.subItems,
                    parentLabel: menuItems[data.parentIndex].label 
                }]);
                setCurrentSubItems(data.subItems);
                setCurrentDisplay(0);
                navigate(`?page=${data.parentIndex}&sub=0`, { replace: true });
            } else if (action === 'backToMain') {
                setNavigationStack([]);
                setCurrentSubItems(null);
                setCurrentDisplay(0);
                navigate(`?page=0`, { replace: true });
            } else if (action === 'backStep') {
                const newStack = [...navigationStack];
                newStack.pop();
                setNavigationStack(newStack);
                setCurrentSubItems(newStack[newStack.length - 1].items);
                setCurrentDisplay(newStack[newStack.length - 1].subIndex);
                navigate(`?page=${newStack[newStack.length - 1].parentIndex}&sub=${newStack[newStack.length - 1].subIndex}`, { replace: true });
            }
            
            setPendingNavigation(null);
        }
    }, [pendingNavigation, isTransitioning, navigationStack, menuItems, navigate]);

    const onExpand = () => {
        setExpanded(prev => !prev);
        setExpandedClass(expanded ? "minimized" : "maximized");
    }

    const handlePageChange = (index) => {
        // Start opacity transition
        setContentOpacity(0);
        
        setTimeout(() => {
            setCurrentDisplay(index);
            // Update URL with the new page number
            navigate(`?page=${index}`, { replace: true });
            
            // Fade content back in
            setTimeout(() => {
                setContentOpacity(1);
            }, 50);
        }, 200);
    }

    const handleSubItemClick = useCallback((parentIndex, subIndex, subItems) => {
        if (enableSubSidebar && subItems && subItems.length > 0) {
            // Start opacity transition
            setContentOpacity(0);
            
            // Set fake menu data for seamless transition
            setFakeMenuData({
                items: subItems,
                isSubMenu: true,
                direction: 'right'
            });
            
            // Start transition animation
            setShowBackButton(true);
            setIsTransitioning(true);
            setTransitionDirection('right');
            
            // Set pending navigation to execute after animation
            setPendingNavigation({
                action: 'subItemClick',
                data: { parentIndex, subIndex, subItems }
            });
            
            // End transition after animation completes
            setTimeout(() => {
                setIsTransitioning(false);
                setFakeMenuData(null); // Clear fake menu after transition
                
                // Fade content back in
                setTimeout(() => {
                    setContentOpacity(1);
                }, 50);
            }, 500);
        } else {
            // Regular page change
            handlePageChange(parentIndex);
        }
    }, [enableSubSidebar, navigate]);

    const handleBackToMain = useCallback(() => {
        // Start opacity transition
        setContentOpacity(0);
        
        // Set fake menu data for seamless transition
        setFakeMenuData({
            items: menuItems,
            isSubMenu: false,
            direction: 'left'
        });
        
        // Start transition animation
        setShowBackButton(false);
        setIsTransitioning(true);
        setTransitionDirection('left');
        
        // Set pending navigation to execute after animation
        setPendingNavigation({
            action: 'backToMain'
        });
        
        // End transition after animation completes
        setTimeout(() => {
            setIsTransitioning(false);
            setFakeMenuData(null); // Clear fake menu after transition
            
            // Fade content back in
            setTimeout(() => {
                setContentOpacity(1);
            }, 50);
        }, 500);
    }, [menuItems]);

    const handleBackStep = useCallback(() => {
        // Start opacity transition
        setContentOpacity(0);
        
        setIsTransitioning(true);
        setTransitionDirection('left');
        
        if (navigationStack.length > 1) {
            // Get the previous menu items for fake menu
            const newStack = [...navigationStack];
            newStack.pop();
            const previousItems = newStack[newStack.length - 1].items;
            
            // Set fake menu data for seamless transition
            setFakeMenuData({
                items: previousItems,
                isSubMenu: true,
                direction: 'left'
            });
            
            // Set pending navigation to execute after animation
            setPendingNavigation({
                action: 'backStep'
            });
            
            // End transition after animation completes
            setTimeout(() => {
                setIsTransitioning(false);
                setFakeMenuData(null); // Clear fake menu after transition
                
                // Fade content back in
                setTimeout(() => {
                    setContentOpacity(1);
                }, 50);
            }, 500);
        } else {
            handleBackToMain();
        }
    }, [navigationStack.length, handleBackToMain]);

    useEffect(() => {
        console.log("currentDisplay", currentDisplay);
    }, [currentDisplay]);

    const renderNavItems = (items, isSubMenu = false) => {
        return (
            <ul>
                {items.map((item, index) => (
                    <li key={index} 
                        className={`${currentDisplay === index ? "selected" : ""}`} 
                        onClick={() => {
                            if (isSubMenu) {
                                // Handle sub-sub items if they exist
                                if (enableSubSidebar && item.subItems && item.subItems.length > 0) {
                                    handleSubItemClick(
                                        navigationStack[navigationStack.length - 1]?.parentIndex || 0, 
                                        index, 
                                        item.subItems
                                    );
                                } else {
                                    // For sub-menu items without sub-items, just update display and URL
                                    setContentOpacity(0);
                                    setTimeout(() => {
                                        setCurrentDisplay(index);
                                        const currentParentIndex = navigationStack[navigationStack.length - 1]?.parentIndex || 0;
                                        navigate(`?page=${currentParentIndex}&sub=${index}`, { replace: true });
                                        
                                        // Fade content back in
                                        setTimeout(() => {
                                            setContentOpacity(1);
                                        }, 50);
                                    }, 200);
                                }
                            } else {
                                // Main menu items
                                if (enableSubSidebar && item.subItems && item.subItems.length > 0) {
                                    handleSubItemClick(index, 0, item.subItems);
                                } else {
                                    handlePageChange(index);
                                }
                            }
                        }}>
                        <Icon icon={item.icon} />
                        <p>{item.label}</p>
                        {enableSubSidebar && item.subItems && item.subItems.length > 0 && (
                            <Icon icon="material-symbols:chevron-right" className="sub-indicator" />
                        )}
                    </li>
                ))}
            </ul>
        );
    }
    
    const getCurrentItems = () => {
        if (currentSubItems) {
            return currentSubItems;
        }
        return menuItems;
    }

    const getCurrentChildren = () => {
        if (hasElementsInMenuItems) {
            // New pattern: elements are in menuItems
            if (currentSubItems) {
                // Return element for sub-items if they exist, otherwise return main children
                return currentSubItems[currentDisplay]?.element || currentSubItems[0]?.element;
            }
            return menuItems[currentDisplay]?.element;
        } else {
            // Legacy pattern: elements are in children prop
            if (currentSubItems) {
                // Return children for sub-items if they exist, otherwise return main children
                return children[currentDisplay] || children[0];
            }
            return children[currentDisplay];
        }
    }

    const fakeLoadIn = () => {
        if (!isTransitioning || !fakeMenuData) {
            return null;
        }
        
        return (
            <nav 
                key={`fake-nav-${Date.now()}`}
                className={`fake-nav nav ${fakeMenuData.direction}-direction`}
            >
                {renderNavItems(fakeMenuData.items, fakeMenuData.isSubMenu)}
            </nav>
        );
    }

    return (
        <div 
            className={`general-dash ${additionalClass}`} 
            style={{
                '--primary-color': primaryColor,
                '--secondary-color': secondaryColor,
            }}
        >
            {
                width < 768 && 
                (
                    <div className="mobile-heading">
                        <img src={logo} alt="Logo" />
                    </div>
                )
            }
            <div className={`dash-left ${expanded ? "hidden" : ""}`}>
                <div className="top">
                    <div className="logo">
                        <img src={logo} alt="Logo" />
                    </div>
                    {middleItem && middleItem}
                    
                    {/* Breadcrumb navigation for sub-sidebar */}
                    {enableSubSidebar && (
                        <div className="breadcrumb-nav" style={{
                            height: showBackButton ? "30px" : "0",
                        }}>
                            {/* <div className="breadcrumb-item" onClick={handleBackToMain}>
                                <Icon icon="material-symbols:home" />
                                <span>Main</span>
                            </div>
                            {navigationStack.map((level, index) => (
                                <div key={index} className="breadcrumb-item">
                                    <Icon icon="material-symbols:chevron-right" />
                                    <span>{level.parentLabel}</span>
                                </div>
                            ))} */}
                            <div className="back" onClick={handleBackStep}>
                                <Icon icon="ep:back" />
                                <p>Back</p>
                            </div>
                        </div>
                    )}
                    {/* main menu */}
                    <div className="nav-container">
                        <nav 
                            key={`nav-${currentSubItems ? 'sub' : 'main'}`}
                            className={`nav ${isTransitioning ? `${transitionDirection}-direction` : ''}`}
                        >
                            {renderNavItems(getCurrentItems(), !!currentSubItems)}
                        </nav>
                        {fakeLoadIn()}
                    </div>
                    
                </div>
                <div className="bottom">
                    {
                        user && (
                        <div className="user">
                            <div className="avatar">
                                <img src={user?.pfp || defaultAvatar} alt="User Avatar" />
                            </div>
                            <div className="user-info">
                                <p className="username">{user.name}</p>
                                <p className="email">{user.email}</p>
                            </div>
                        </div>
                        )
                    }
                    <div className="back" onClick={() => navigate('/room/none')}>
                        <Icon icon="ep:back" />
                        <p>Back to Study Compass</p>
                    </div>
                </div>
            </div>
            <div className={`dash-right ${expandedClass}`}>
                <div 
                    className="dash-content"
                    style={{
                        opacity: contentOpacity,
                        transition: 'opacity 0.3s ease-in-out'
                    }}
                >
                    {getCurrentChildren()}
                </div>
                <div className={`expand`} onClick={onExpand}>
                    <Icon icon="material-symbols:expand-content-rounded" />
                </div>
            </div>
        </div>
    );
}

export default Dashboard;