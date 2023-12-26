import './App.css';
import DayColumn from './components/DayColumn/DayColumn';

function App() {
    const day = 'Monday';
    const dayEvents = [
        { title: 'Meeting with Team', start_time: '08:00', end_time: '10:00' },
        { title: 'Lunch Break', start_time: '12:30', end_time: '13:30' },
    ];

    return (
        <DayColumn day={day} dayEvents={dayEvents}/>
    );
}

export default App;
