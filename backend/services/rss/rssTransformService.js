const { parseString } = require('xml2js');
const { promisify } = require('util');

const parseXml = promisify(parseString);

class RssTransformService {
    constructor() {
        // Default field mappings for common RSS feed formats
        this.defaultMappings = {
            name: {
                paths: ['title', 'item.title'],
                transform: (value) => value?.trim()
            },
            description: {
                paths: ['description', 'item.description'],
                transform: (value) => value?.trim()
            },
            start_time: {
                paths: ['pubDate', 'item.pubDate'],
                transform: (value) => value ? new Date(value) : null
            },
            end_time: {
                paths: ['endDate', 'item.endDate'],
                transform: (value) => value ? new Date(value) : null
            },
            location: {
                paths: ['location', 'item.location', 'item.where'],
                transform: (value) => value?.trim() || 'TBD'
            },
            contact: {
                paths: ['contact', 'item.contact'],
                transform: (value) => value?.trim()
            },
            type: {
                paths: ['category', 'item.category'],
                transform: (value) => {
                    if (Array.isArray(value)) {
                        return value[0]?.trim() || 'Other';
                    }
                    return value?.trim() || 'Other';
                }
            },
            rssId: {
                paths: ['guid'],
                transform: (value) => value?.trim()
            }
        };
    }

    /**
     * Clean XML content by properly escaping special characters in URLs
     * @param {string} xmlContent - Raw XML content
     * @returns {string} - Cleaned XML content
     */
    cleanXmlContent(xmlContent) {
        // Replace unescaped ampersands in URLs with &amp;
        // This regex looks for & that are not already part of an entity (&amp;, &lt;, etc.)
        return xmlContent.replace(/&(?!(?:amp|lt|gt|quot|apos);)/g, '&amp;');
    }

    /**
     * Configure custom field mappings for a specific RSS feed
     * @param {Object} customMappings - Custom field mappings to override defaults
     */
    configureMappings(customMappings) {
        this.defaultMappings = {
            ...this.defaultMappings,
            ...customMappings
        };
    }

    /**
     * Extract value from RSS feed using configured paths
     * @param {Object} feed - Parsed RSS feed object
     * @param {Array} paths - Array of possible paths to find the value
     * @returns {*} - Found value or null
     */
    extractValue(feed, paths) {
        for (const path of paths) {
            const parts = path.split('.');
            let value = feed;
            
            for (const part of parts) {
                if (value && value[part]) {
                    value = value[part];
                } else {
                    value = null;
                    break;
                }
            }
            
            if (value !== null) {
                return value;
            }
        }
        return null;
    }

    /**
     * Transform RSS feed into events
     * @param {string} xmlContent - Raw XML content from RSS feed
     * @param {Object} options - Configuration options
     * @returns {Promise<Array>} - Array of transformed events
     */
    async transformFeed(xmlContent, options = {}) {
        try {
            // Clean XML content before parsing
            const cleanedXml = this.cleanXmlContent(xmlContent);
            // Parse XML content
            const parsedFeed = await parseXml(cleanedXml);
            
            // Get the channel or feed object
            const feed = parsedFeed.rss?.channel || parsedFeed.feed;
            if (!feed) {
                throw new Error('Invalid RSS feed format');
            }
            // Get items from feed
            const items = Array.isArray(feed[0].item) ? feed[0].item : [feed[0].item];
            // Transform items into events
            const events = items.map(item => {
                const event = {};
                
                // Apply mappings to create event object
                Object.entries(this.defaultMappings).forEach(([field, config]) => {
                    const value = this.extractValue(item, config.paths);
                    if (value !== null) {
                        event[field] = config.transform(value);
                    }
                });

                // Set default values for required fields
                event.visibility = options.visibility || 'public';
                event.expectedAttendance = options.expectedAttendance || 0;
                event.status = options.status || 'not-applicable';
                event.isDeleted = options.isDeleted || false;
                
                // If no end_time is provided, set it to start_time + 1 hour
                if (!event.end_time && event.start_time) {
                    event.end_time = new Date(event.start_time.getTime() + 60 * 60 * 1000);
                }

                return event;
            });

            return events;
        } catch (error) {
            console.error('Error transforming RSS feed:', error);
            throw error;
        }
    }

    /**
     * Create a custom transformer for a specific RSS feed format
     * @param {Object} config - Configuration for the custom transformer
     * @returns {Function} - Custom transformer function
     */
    createCustomTransformer(config) {
        return async (xmlContent) => {
            // Apply custom mappings if provided
            if (config.mappings) {
                this.configureMappings(config.mappings);
            }
            
            // Transform feed with custom options
            return this.transformFeed(xmlContent, config.options);
        };
    }
}

module.exports = new RssTransformService(); 