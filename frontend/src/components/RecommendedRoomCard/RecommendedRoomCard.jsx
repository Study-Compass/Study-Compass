import React from 'react';
import { useNavigate } from 'react-router-dom';
import './RecommendedRoomCard.scss';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';

const RecommendedRoomCard = ({ room }) => {
    const navigate = useNavigate();

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
                <Icon icon="material-symbols:door-open" />
                <span>Recommended Room</span>
            </div>
            <div className="card-content">
                <h3 className="room-name">{room.name}</h3>
                {room.attributes && room.attributes.length > 0 && (
                    <div className="room-attributes">
                        {room.attributes.slice(0, 2).map((attribute, index) => (
                            <span key={index} className="attribute-tag">
                                {attribute}
                            </span>
                        ))}
                        {room.attributes.length > 2 && (
                            <span className="attribute-tag more">
                                +{room.attributes.length - 2}
                            </span>
                        )}
                    </div>
                )}
                <div className="card-footer">
                    <span className="view-details">View Details</span>
                    <Icon icon="mingcute:arrow-right-line" />
                </div>
            </div>
        </div>
    );
};

export default RecommendedRoomCard;
