const rssTransformService = require('./rssTransformService');
const fs = require('fs').promises;
const path = require('path');

async function testRssTransform() {
    try {
        //read from example file
        const xmlContent = await fs.readFile(
            path.join(__dirname, 'examples', 'athletics.xml'),
            'utf8'
        );

        // Helper function to handle array values from xml2js
        const getValue = (value) => {
            if (Array.isArray(value)) {
                return value[0];
            }
            return value;
        };

        // Create a custom transformer specifically for RPI's athletics feed format
        const athleticsTransformer = rssTransformService.createCustomTransformer({
            mappings: {
                name: {
                    paths: ['title'],
                    transform: (value) => {
                        const titleValue = getValue(value);
                        if (!titleValue) return null;
                        
                        //remove date prefix (e.g., "4/22 ")
                        let name = titleValue.replace(/^\d{1,2}\/\d{1,2}\s+/, '');
                        
                        //remove time prefix (e.g., "4:00 PM ")
                        name = name.replace(/^\d{1,2}:\d{2}\s+[AP]M\s+/, '');
                        
                        //remove status prefixes like [W], [L], [N], POSTPONED
                        name = name.replace(/^\[[WLN]\]\s+/, '');
                        name = name.replace(/^POSTPONED\s+/, '');
                        
                        //remove make-up game suffix
                        name = name.replace(/\s+-\s+MAKE-UP\s+FROM.*$/, '');
                        name = name.replace(/\s+-\s+Continuation\s+from.*$/, '');
                        
                        name = name.replace(/&#39;/g, "'");
                        
                        return name.trim();
                    }
                },
                description: {
                    paths: ['description'],
                    transform: (value) => {
                        const descValue = getValue(value);
                        if (!descValue) return null;
                        return descValue.trim();
                    }
                },
                start_time: {
                    paths: ['ev:startdate'],
                    transform: (value) => {
                        //check if value has a time or is just a date
                        const dateValue = getValue(value);
                        if (!dateValue) return null;
                        return new Date(dateValue);
                    }
                },
                end_time: {
                    paths: ['ev:enddate'],
                    transform: (value) => {
                        const dateValue = getValue(value);
                        if (!dateValue) return null;
                        return new Date(dateValue);
                    }
                },
                location: {
                    paths: ['ev:location'],
                    transform: (value) => {
                        const locationValue = getValue(value);
                        if (!locationValue) return null;
                        return locationValue.trim();
                    }
                },
                type: {
                    paths: ['title'],
                    transform: (value) => {
                        const titleValue = getValue(value);
                        if (!titleValue) return 'Other';
                        // Extract sport type from title (e.g., "Women's Tennis", "Baseball")
                        const match = titleValue.match(/\[W\]\s+([^v]+)/);
                        return match ? match[1].trim() : 'Other';
                    }
                },
                rssId: {
                    paths: ['guid'],
                    transform: (value) => {
                        const guidValue = getValue(value);
                        if (!guidValue._) return null;
                        console.log('guidValue');
                        console.log(guidValue._);
                        return guidValue._.trim();
                    }
                },
                opponent: {
                    paths: ['s:opponent'],
                    transform: (value) => {
                        const opponentValue = getValue(value);
                        if (!opponentValue) return null;
                        return opponentValue.trim();
                    }
                },
                gameId: {
                    paths: ['s:gameid'],
                    transform: (value) => {
                        const gameIdValue = getValue(value);
                        if (!gameIdValue) return null;
                        return gameIdValue.trim();
                    }
                },
                isDeleted: {
                    paths: ["ev:startdate"],
                    transform: (value) => {
                        //don't show events that don't have a time and just a date
                        if (value.contains('T')){
                            return false;
                        }
                        return true;
                    }
                }
            },
            options: {
                visibility: 'public',
                expectedAttendance: 0,
                status: 'not-applicable',
                isDeleted: false
            }
        });

        // Transform the feed
        const events = await athleticsTransformer(xmlContent);
        
        // Convert dates to MongoDB extended JSON format for import
        const serializedEvents = events.map(event => ({
            ...event,
            start_time: event.start_time instanceof Date && !isNaN(event.start_time)
                ? { $date: event.start_time.toISOString() }
                : null,
            end_time: event.end_time instanceof Date && !isNaN(event.end_time)
                ? { $date: event.end_time.toISOString() }
                : null
        }));

        // Write events to JSON file
        await fs.writeFile(
            path.join(__dirname, 'logevents.json'),
            JSON.stringify(serializedEvents, null, 2)
        );

        console.log('Events have been written to logevents.json');

    } catch (error) {
        console.error('Test failed:', error);
    }
}

// Run the test
testRssTransform(); 