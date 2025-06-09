const rssTransformService = require('./rssTransformService');
const fs = require('fs').promises;
const path = require('path');

async function testRssTransform() {
    try {
        //read from example file
        const xmlContent = await fs.readFile(
            path.join(__dirname, 'examples', 'rpi.xml'),
            'utf8'
        );

        // Helper function to handle array values from xml2js
        const getValue = (value) => {
            if (Array.isArray(value)) {
                return value[0];
            }
            return value;
        };

        // Create a custom transformer specifically for RPI's feed format
        const rpiTransformer = rssTransformService.createCustomTransformer({
            mappings: {
                name: {
                    paths: ['title'],
                    transform: (value) => getValue(value)?.trim()
                },
                description: {
                    paths: ['description'],
                    transform: (value) => {
                        const descValue = getValue(value)._;
                        if (!descValue) return null;

                        // Extract date range and location from description
                        const line = descValue.split('Description: ').map(line => line.trim())[1];
                        const description = line.split('Contact: ')[0];
                        return description.trim();

                    }
                },
                start_time: {
                    paths: ['pubDate'],
                    transform: (value) => {
                        const dateValue = getValue(value);
                        if (!dateValue) return null;
                        // Parse the date from the description field
                        const dateMatch = dateValue.match(/([A-Za-z]+, [A-Za-z]+ \d+, \d{4} \d+:\d+ [AP]M)/);
                        return dateMatch ? new Date(dateMatch[1]) : new Date(dateValue);
                    }
                },
                end_time: {
                    paths: ['description'],
                    transform: (value) => {
                        const descValue = getValue(value)._;
                        if (!descValue) return null;
                        // Extract end date from the description
                        const dateRange = descValue.split(' - ')[1];
                        if (!dateRange) return null;
                        
                        const endDateMatch = dateRange.match(/([A-Za-z]+, [A-Za-z]+ \d+, \d{4} \d+:\d+ [AP]M)/);
                        return endDateMatch ? new Date(endDateMatch[1]) : null;
                    }
                },
                location: {
                    paths: ['description'],
                    transform: (value) => {
                        const descValue = getValue(value)._;
                        if (!descValue) return null;

                        // Extract date range and location from description
                        const line = descValue.split('Where: ').map(line => line.trim())[1];
                        const location = line.split('Description: ')[0];
                        return location.trim();                    
                    }
                },
                contact: {
                    paths: ['description'],
                    transform: (value) => {
                        const descValue = getValue(value)._;
                        if (!descValue) return null;
                        const contactLine = descValue.split('\n').find(line => line.includes('Contact:'));
                        return contactLine ? contactLine.replace('Contact:', '').trim() : null;
                    }
                },
                type: {
                    paths: ['category'],
                    transform: (value) => {
                        if (Array.isArray(value)) {
                            // Join multiple categories with a comma
                            return value.map(cat => getValue(cat).trim()).join(', ');
                        }
                        return getValue(value)?.trim() || 'Other';
                    }
                },
                rssId: {
                    paths: ['guid'],
                    transform: (value) => {
                        console.log('value')
                        console.log(value[0]._)
                        return value[0]._?.trim()
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
        const events = await rpiTransformer(xmlContent);
        
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