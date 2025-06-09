const getValue = (value) => {
    if (Array.isArray(value)) {
        return value[0];
    }
    return value;
};

function sanitizeString(raw) {
    return raw
      .replace(/<[^>]*>/g, '')       // Remove HTML tags
      .replace(/\t+/g, ' ')           // Replace tabs with spaces
      .replace(/\s{2,}/g, ' ')        // Replace multiple spaces/newlines with a single space
      .replace(/\n+/g, ' ')           // Replace newlines with space
      .trim();                        // Trim leading/trailing spaces
}

const athleticsTransformer = {
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
                return sanitizeString(descValue);
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
                return sanitizeString(locationValue);
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
        type:{
            paths: ['title'],
            transform: (value) => {
                return "sports";
            }
        },
        // opponent: {
        //     paths: ['s:opponent'],
        //     transform: (value) => {
        //         const opponentValue = getValue(value);
        //         if (!opponentValue) return null;
        //         return opponentValue.trim();
        //     }
        // },
        isDeleted: {
            paths: ["ev:startdate"],
            transform: (value) => {
                //don't show events that don't have a time and just a date
                const dateValue = getValue(value);
                if (dateValue && dateValue.includes('T') ){
                    return false;
                }
                console.log('does not contain T');
                return true;
            }
        }
    },
    options: {
        visibility: 'public',
        expectedAttendance: 0,
        status: 'not-applicable',
        hostingId: "68409b5578c70a803cbe0f9e",
        hostingType: "Org",
    }
};

const rpiTransformer = {
    mappings: {
        name: {
            paths: ['title'],
            transform: (value) => getValue(value) ? sanitizeString(getValue(value)) : null
        },
        description: {
            paths: ['description'],
            transform: (value) => {
                const descValue = typeof getValue(value) === 'string' ? getValue(value) : getValue(value)?._;
                if (!descValue) return null;

                // Extract date range and location from description
                const line = descValue.split('Description: ').map(line => line.trim())[1];
                const description = line.split('Contact: ')[0];
                return sanitizeString(description);

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
                const descValue = typeof getValue(value) === 'string' ? getValue(value) : getValue(value)?._;
                if (!descValue) return null;
                // Extract date range and location from description
                const line = descValue.split('Where: ').map(line => line.trim())[1];
                const location = line.split('Description: ')[0];
                return sanitizeString(location);                    
            }
        },
        contact: {
            paths: ['description'],
            transform: (value) => {
                const descValue = typeof getValue(value) === 'string' ? getValue(value) : getValue(value)?._;
                if (!descValue) return null;
                const contactLine = descValue.split('\n').find(line => line.includes('Contact:'));
                return contactLine ? sanitizeString(contactLine.replace('Contact:', '').trim()) : null;
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
                return value[0]._?.trim()
            }
        },
        type: {
            paths: ['title'],
            transform: (value) => {
                return "campus";
            }
        },
        externalLink: {
            paths: ['link'],
            transform: (value) => {
                console.log('link');
                console.log(value);
                return value[0].trim()
            }
        }
    },
    options: {
        visibility: 'public',
        expectedAttendance: 0,
        status: 'not-applicable',
        isDeleted: false,
        hostingId: "68420c55ca45c6130af36268",
        hostingType: "Org",
    }
}

const transformers = {
    "rpi.athletics": athleticsTransformer,
    "rpi.institute": rpiTransformer
}

module.exports = transformers;