import React from 'react';
import './SelectedRoomsPreview.scss';
import FilledStar from '../../assets/Icons/FilledStar.svg';

function SelectedRoomsPreview({name="Darrin Communications Center 330", rating=4.3, attributes, availability, selected = false}) {

    
    return (
        <div className="selected-rooms-preview">

            <img src={"https://studycompass.s3.amazonaws.com/downsizedPlaceholder.jpeg"} alt="logo" />
            <div className='preview-info'>
                <title-wrapper className="div">
                    <h1 className="room-name">{name}</h1>
                    <div className="rating-wrapper">
                        <img src={FilledStar} alt="star" />
                        <p>{rating}</p>
                    </div>
                    {selected ? <div className="room-info-wrapper"> {attributes?.map(attribute => {
                        return <div className="room-info-item" key={attribute}>{attribute}</div>;
                    })} </div> : <div></div>}
                    <div className="avalibility-wrapper">
                        <div className="dot"></div> <p> {availability} </p>
                    </div>
                </title-wrapper>
            </div>
        </div>
    );
}

export default SelectedRoomsPreview;
