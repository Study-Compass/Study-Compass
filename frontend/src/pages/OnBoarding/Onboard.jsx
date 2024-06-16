import React, { useState, useEffect, useRef } from 'react';
import './Onboard.css';
import PurpleGradient from '../../assets/PurpleGrad.svg';
import YellowRedGradient from '../../assets/YellowRedGrad.svg';
import Loader from '../../components/Loader/Loader.jsx';
import DragList from './DragList/DragList.jsx';
import Recommendation from './Recommendation/Recommendation.jsx';

function Onboard(){
    const [current, setCurrent] = useState(0);
    const [show, setShow] = useState(0);
    const [currentTransition, setCurrentTransition] = useState(0);
    const [containerHeight, setContainerHeight] = useState(175);

    const [buttonActive, setButtonActive] = useState(true);

    const containerRef = useRef(null);
    const contentRefs = useRef([]);

    const [items, setItems] = useState(["outlets", "classroom type", "printer"]);
    const details = {
        "outlets": "having outlet access from a majority of seats",
        "classroom type": "ex: lecture hall, classroom, auditorium",
        "printer": "having a printer in the room",
        "table type": "ex: small desks, large tables,",
    }

    useEffect(()=>{
        if (containerRef.current) {
            setContainerHeight(contentRefs.current[0].clientHeight+10);
        }
    }, []);
    

    useEffect(()=>{
        if(current === 0){return;}
        setTimeout(() => {
            setCurrentTransition(currentTransition+1);
        }, 500);
        if (contentRefs.current[current] && current !== 0) {
            setTimeout(() => {
                setContainerHeight(contentRefs.current[current].offsetHeight);
            }, 500);
            console.log(contentRefs.current[current].offsetHeight);
            console.log(current);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [current]);

    useEffect(()=>{
        if(show === 0){return;}
        setTimeout(() => {
            setCurrent(current+1);
        }, 500);

        setButtonActive(false);
        setTimeout(() => {
            setButtonActive(true);
        }, 1000);
    }, [show]);





    const [viewport, setViewport] = useState("100vh");

    useEffect(() => {
        setViewport((window.innerHeight) + 'px');
    },[]);

    return (
        <div className="onboard" style={{height: viewport}}>
            <img src={YellowRedGradient} alt="" className="yellow-red" />
            <img src={PurpleGradient} alt="" className="purple" />

            <div className="content" style={{ height: containerHeight}} ref={containerRef}>
                <div >
                    { current === 0 &&
                        <div className={`content ${show === 1 ? "going": ""}`} ref={el => contentRefs.current[0] = el}>
                            {/* <img src={Compass} alt="Logo" className="logo" /> */}
                            <Loader/>
                            <h2>welcome to study compass</h2>
                            <p>Study Compass is a student-created tool designed to help students find study spaces according to their preferences</p>
                        </div>
                    }
                    { current === 1 &&
                        <div className={`content ${show === 2 ? "going": ""} ${1 === currentTransition ? "": "beforeOnboard"}`} ref={el => contentRefs.current[1] = el}>
                            {/* <img src={Compass} alt="Logo" className="logo" /> */}
                            <h2>rank your classroom preferences</h2>
                            <DragList items={items} setItems={setItems} details={details}/>
                        </div>
                    }
                    { current === 2 &&
                        <div className={`content ${current === 3 ? "going": ""} ${2 === currentTransition ? "": "beforeOnboard"}`} ref={el => contentRefs.current[2] = el}>
                            <Recommendation />
                        </div>
                    }
                    { current === 3 &&
                        <div className={`content ${current === 4 ? "going": ""} ${3 === currentTransition ? "": "beforeOnboard"}`} ref={el => contentRefs.current[3] = el}>
                        </div>
                    }
                </div>
            </div>
                <button className={`${buttonActive ? "":"deactivated"}`} onClick={()=>{setShow(show+1)}}>
                    next
                </button>
                
        </div>
    )
}

export default Onboard;