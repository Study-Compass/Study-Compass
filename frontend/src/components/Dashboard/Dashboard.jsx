import React, { useState, useEffect } from 'react';
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
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

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
        if (page >= 0 && page < menuItems.length) {
            setCurrentDisplay(page);
        }
    }, [searchParams, menuItems.length]);

    const onExpand = () => {
        setExpanded(prev => !prev);
        setExpandedClass(expanded ? "minimized" : "maximized");
    }

    const handlePageChange = (index) => {
        setCurrentDisplay(index);
        // Update URL with the new page number
        navigate(`?page=${index}`, { replace: true });
    }

    const handleSubItemClick = (parentIndex, subIndex, subItems) => {
        if (enableSubSidebar && subItems && subItems.length > 0) {
            // Navigate to sub-sidebar
            setNavigationStack(prev => [...prev, { 
                parentIndex, 
                subIndex, 
                items: subItems,
                parentLabel: menuItems[parentIndex].label 
            }]);
            setCurrentSubItems(subItems);
            setCurrentDisplay(subIndex);
            navigate(`?page=${parentIndex}&sub=${subIndex}`, { replace: true });
        } else {
            // Regular page change
            handlePageChange(parentIndex);
        }
    }

    const handleBackToParent = () => {
        if (navigationStack.length > 0) {
            const newStack = [...navigationStack];
            const currentLevel = newStack.pop();
            
            if (newStack.length > 0) {
                // Go back to previous sub-level
                const previousLevel = newStack[newStack.length - 1];
                setCurrentSubItems(previousLevel.items);
                setCurrentDisplay(previousLevel.subIndex);
                navigate(`?page=${previousLevel.parentIndex}&sub=${previousLevel.subIndex}`, { replace: true });
            } else {
                // Go back to main menu
                setCurrentSubItems(null);
                setCurrentDisplay(currentLevel.parentIndex);
                navigate(`?page=${currentLevel.parentIndex}`, { replace: true });
            }
            
            setNavigationStack(newStack);
        }
    }

    const handleBackToMain = () => {
        setNavigationStack([]);
        setCurrentSubItems(null);
        setCurrentDisplay(0);
        navigate(`?page=0`, { replace: true });
    }

    const renderNavItems = (items, isSubMenu = false) => {
        return items.map((item, index) => (
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
                            setCurrentDisplay(index);
                            navigate(`?page=${navigationStack[navigationStack.length - 1]?.parentIndex || 0}&sub=${index}`, { replace: true });
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
        ));
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
                    {enableSubSidebar && navigationStack.length > 0 && (
                        <div className="breadcrumb-nav">
                            <div className="breadcrumb-item" onClick={handleBackToMain}>
                                <Icon icon="material-symbols:home" />
                                <span>Main</span>
                            </div>
                            {navigationStack.map((level, index) => (
                                <div key={index} className="breadcrumb-item">
                                    <Icon icon="material-symbols:chevron-right" />
                                    <span>{level.parentLabel}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    <nav className="nav">
                        <ul>
                            {renderNavItems(getCurrentItems(), !!currentSubItems)}
                        </ul>
                    </nav>
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
                {getCurrentChildren()}
                <div className={`expand`} onClick={onExpand}>
                    <Icon icon="material-symbols:expand-content-rounded" />
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
