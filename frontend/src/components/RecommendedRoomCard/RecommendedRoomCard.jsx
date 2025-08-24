import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './RecommendedRoomCard.scss';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';
import FilledStar from '../../assets/Icons/FilledStar.svg';

// Import attribute icons
import Outlets from '../../assets/Icons/Outlets.svg';
import Windows from '../../assets/Icons/Windows.svg';
import Printer from '../../assets/Icons/Printer.svg';

const RecommendedRoomCard = ({ room }) => {
    const navigate = useNavigate();
    const attributesContainerRef = useRef(null);
    const [visibleAttributes, setVisibleAttributes] = useState([]);
    const [hiddenCount, setHiddenCount] = useState(0);

    // Attribute icons mapping (same as Classroom component)
    const attributeIcons = {
        "outlets": Outlets,
        "windows": Windows,
        "printer": Printer
    };

    // Calculate visible attributes for two-row layout with smart overflow
    useEffect(() => {
        if (!room?.attributes || room.attributes.length === 0) {
            setVisibleAttributes([]);
            setHiddenCount(0);
            return;
        }

        // Allow for approximately 2 rows of tags (roughly 6-8 tags total)
        const maxVisibleTags = 7; // Conservative estimate for 2 rows
        
        if (room.attributes.length <= maxVisibleTags) {
            // Show all attributes if they fit
            setVisibleAttributes(room.attributes);
            setHiddenCount(0);
        } else {
            // Show maxVisibleTags - 1 attributes and replace the last one with "+X more"
            const visibleCount = maxVisibleTags - 1;
            setVisibleAttributes(room.attributes.slice(0, visibleCount));
            setHiddenCount(room.attributes.length - visibleCount);
        }
    }, [room?.attributes]);

    console.log(room);

    const handleClick = () => {
        if (room && room._id) {
            navigate(`/room/${room.name}`);
        }
    };

    if (!room) {
        return (
            <div className="recommended-room-card">
                <div className="card-header">
                    <Icon icon="material-symbols:door-open" />
                    <span>No Room Available</span>
                </div>
                <div className="card-content">
                    <p>No recommended rooms found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="recommended-room-card" onClick={handleClick}>
            <div className="card-header">
                <img src={room.image} alt={room.name} />
            </div>
            <div className="card-content">
                <div className="content-top">   
                        <h3 className="room-name">
                            {room.name}
                        
                        </h3>
                                    
                    {/* Available Status */}
                    <div className="room-stats-row">
                    <div className="room-rating">
                                <img src={FilledStar} alt="star" className="star-icon" />
                                <span className="rating-text">{room.rating || 4.2}</span>
                            </div>
                    <div className="free-until">
                        <div className="dot">
                            <div className="outer-dot"></div>
                            <div className="inner-dot"></div>
                        </div>
                            Available Now
                        </div>
                    </div>
                    {visibleAttributes.length > 0 && (
                        <div className="room-attributes" ref={attributesContainerRef}>
                            {visibleAttributes.map((attribute, index) => (
                                <div key={index} className="attribute">
                                    {attribute in attributeIcons ? <img src={attributeIcons[attribute]} alt={attribute} /> : ""}
                                    {attribute}
                                </div>
                            ))}
                            {hiddenCount > 0 && (
                                <div className="attribute more">
                                    +{hiddenCount} more
                                </div>
                            )}
                        </div>
                    )}
                </div>
                
                <div className="card-footer">
                    <span className="view-details">View Details</span>
                    <Icon icon="mingcute:arrow-right-line" className="arrow-icon" />
                </div>
            </div>
        </div>
    );
};

export default RecommendedRoomCard;
