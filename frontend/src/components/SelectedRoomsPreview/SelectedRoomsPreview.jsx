import React from 'react';
import './SelectedRoomsPreview.scss';
import FilledStar from '../../assets/Icons/FilledStar.svg';

function SelectedRoomsPreview({room, availability, selected = false, onSelect, optionIndex}) {
    console.log(room);

    const handleSelect = () => {
        onSelect(optionIndex);
    }
    
    return (
        <div className="selected-rooms-preview" onClick={handleSelect}>

            <img src={"https://studycompass.s3.amazonaws.com/downsizedPlaceholder.jpeg"} alt="logo" className='image'/>
            <div className='preview-info'>
                <title-wrapper className="div">
                    <h2 className="room-name">{room.name}</h2>
                    <div className="rating-wrapper">
                        <img src={FilledStar} alt="star" />
                        <p>{room.average_rating}</p>
                    </div>
                    {selected ? <div className="room-info-wrapper"> {room?.attributes?.map(attribute => {
                        return <div className="room-info-item" key={attribute}>{attribute}</div>;
                    })} </div> : <div></div>}
                    <div className="avalibility-wrapper">
                        <div className="dot"></div> <p> {room.availability} </p>
                    </div>
                </title-wrapper>
            </div>
        </div>
    );
}

export default SelectedRoomsPreview;
