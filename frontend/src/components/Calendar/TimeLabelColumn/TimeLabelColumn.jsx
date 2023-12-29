import './TimeLabelColumn.css';
import '../../assets/fonts.css';

function TimeLabelColumn(){
    return (
        <div className="TimeLabelColumn">
                <div className="time-label" style={{gridRowStart:1, gridRowEnd:3}}><p>8:00</p></div>
                <div className="time-label" style={{gridRowStart:3, gridRowEnd:5}}><p>9:00</p></div>
                <div className="time-label" style={{gridRowStart:5, gridRowEnd:7}}><p>10:00</p></div>
                <div className="time-label" style={{gridRowStart:7, gridRowEnd:9}}><p>11:00</p></div>
                <div className="time-label" style={{gridRowStart:9, gridRowEnd:11}}><p>12:00</p></div>
                <div className="time-label" style={{gridRowStart:11, gridRowEnd:13}}><p>1:00</p></div>
                <div className="time-label" style={{gridRowStart:13, gridRowEnd:15}}><p>2:00</p></div>
                <div className="time-label" style={{gridRowStart:15, gridRowEnd:17}}><p>3:00</p></div>
                <div className="time-label" style={{gridRowStart:17, gridRowEnd:19}}><p>4:00</p></div>
                <div className="time-label" style={{gridRowStart:19, gridRowEnd:21}}><p>5:00</p></div>
                <div className="time-label" style={{gridRowStart:21, gridRowEnd:23}}><p>6:00</p></div>
                <div className="time-label" style={{gridRowStart:23, gridRowEnd:25}}><p>7:00</p></div>
                <div className="time-label" style={{gridRowStart:25, gridRowEnd:27}}><p>8:00</p></div>
        </div>
    );
}

export default TimeLabelColumn;