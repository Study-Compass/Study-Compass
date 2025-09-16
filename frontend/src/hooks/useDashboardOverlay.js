import { useDashboard } from '../contexts/DashboardContext';

/**
 * Custom hook for easy overlay management in Dashboard components
 * @returns {Object} Object containing showOverlay and hideOverlay functions
 */
export const useDashboardOverlay = () => {
    const { showOverlay, hideOverlay } = useDashboard();

    /**
     * Show an overlay with the provided content
     * @param {React.ReactNode} content - The content to display in the overlay
     */
    const show = (content) => {
        showOverlay(content);
    };

    /**
     * Hide the current overlay
     */
    const hide = () => {
        hideOverlay();
    };

    /**
     * Show an EventViewer overlay
     * @param {Object} event - The event object to display
     * @param {Object} options - Options for the EventViewer
     * @param {boolean} options.showBackButton - Whether to show the back button
     * @param {boolean} options.showAnalytics - Whether to show analytics tab
     * @param {boolean} options.showEventsByCreator - Whether to show events by creator
     * @param {string} options.className - Additional CSS class
     */
    const showEventViewer = (event, options = {}) => {
        const {
            showBackButton = true,
            showAnalytics = true,
            showEventsByCreator = false,
            className = 'full-width-event-viewer'
        } = options;

        // Import EventViewer dynamically to avoid circular dependencies
        import('../components/EventViewer').then(({ default: EventViewer }) => {
            showOverlay(
                <EventViewer 
                    event={event}
                    onBack={hide}
                    showBackButton={showBackButton}
                    showAnalytics={showAnalytics}
                    showEventsByCreator={showEventsByCreator}
                    className={className}
                />
            );
        });
    };

    return {
        showOverlay: show,
        hideOverlay: hide,
        showEventViewer
    };
};
