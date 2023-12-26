import './App.css';
import DayColumn from './components/DayColumn/DayColumn';

function App() {
    const days = ["M","T","W","R","F"];
    const data = {
        "name": "Academy Hall AUD",
        "weekly_schedule": {
          "M": [
            {
              "class_name": "ENGR 1100",
              "start_time": "08:00",
              "end_time": "10:00"
            },
            {
              "class_name": "ENGR 1100",
              "start_time": "10:00",
              "end_time": "12:00"
            },
            {
              "class_name": "ENGR 1100",
              "start_time": "12:00",
              "end_time": "14:00"
            },
            {
              "class_name": "ENGR 1100",
              "start_time": "14:00",
              "end_time": "16:00"
            },
            {
              "class_name": "PSYC 4500",
              "start_time": "18:00",
              "end_time": "20:00"
            }
          ],
          "T": [
            {
              "class_name": "ADMN 1824",
              "start_time": "16:00",
              "end_time": "17:00"
            },
            {
              "class_name": "CHME 4040",
              "start_time": "13:00",
              "end_time": "14:00"
            },
            {
              "class_name": "ENGR 1100",
              "start_time": "10:30",
              "end_time": "12:30"
            }
          ],
          "W": [
            {
              "class_name": "CHME 4040",
              "start_time": "13:00",
              "end_time": "14:00"
            },
            {
              "class_name": "CHEM 2120",
              "start_time": "14:00",
              "end_time": "15:00"
            }
          ],
          "R": [
            {
              "class_name": "ENGR 1100",
              "start_time": "08:00",
              "end_time": "10:00"
            },
            {
              "class_name": "ENGR 1100",
              "start_time": "10:00",
              "end_time": "12:00"
            },
            {
              "class_name": "ENGR 1100",
              "start_time": "12:00",
              "end_time": "14:00"
            },
            {
              "class_name": "ENGR 1100",
              "start_time": "14:00",
              "end_time": "16:00"
            },
            {
              "class_name": "PSYC 4500",
              "start_time": "18:00",
              "end_time": "20:00"
            }
          ],
          "F": [
            {
              "class_name": "CHME 4040",
              "start_time": "13:00",
              "end_time": "14:00"
            },
            {
              "class_name": "ENGR 1100",
              "start_time": "10:00",
              "end_time": "12:00"
            }
          ]
        }
      }
    const dayEvents = [
        { title: 'Meeting with Team', start_time: '08:00', end_time: '10:00' },
        { title: 'Lunch Break', start_time: '12:30', end_time: '13:30' },
    ];

    return (
        <div className="App">
            <div className="App-body">
                {days.map((day) => (
                    <DayColumn day={day} dayEvents={data["weekly_schedule"][day]} />
                ))}
            </div>
        </div>
    );
}

export default App;
