import React from 'react';
import './RatingGraph.scss';
import FilledStar from '../../../../assets/Icons/FilledStar.svg';

function RatingGraph({ ratings, average_rating }) {
    if(!ratings){
        return '';
    }
    return (
        <div className="rating-graph">
            <div className="number-col">
                <div className="rating-score">
                    <img src={FilledStar} alt="" />
                    <h3>{average_rating}</h3>
                </div>
                <p>{ratings.length} reviews</p>
            </div>
            <div className="ratings-col">
                {/* 5 rows */}
                {[5, 4, 3, 2, 1].map((rating) => {
                    const ratingCount = ratings.filter((r) => Math.ceil(r.score) === rating).length;
                    return (
                        <div key={rating} className="rating-row">
                            <div className="rating-stars">
                                <p>{rating}</p>
                            </div>
                            <div className="bar">
                                <div className="bar-fill" style={{ width: `${(ratingCount / ratings.length) * 100}%` }}></div>
                            </div>
                        </div>
                    );
                } )}
            </div>
        </div>
    );
}

export default RatingGraph;