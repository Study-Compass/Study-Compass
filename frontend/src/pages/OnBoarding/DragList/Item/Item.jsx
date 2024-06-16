import * as React from "react";
import { useMotionValue, Reorder } from "framer-motion";
import { useRaisedShadow } from "../useRaisedShadow";

function Item({ item, details }) {
    const y = useMotionValue(0);
    const boxShadow = useRaisedShadow(y);

    return (
        <Reorder.Item value={item} id={item} style={{ boxShadow, y }}>
            <h3>{item}</h3>
            {
                details[item] && <h4>{details[item]}</h4>
            }
        </Reorder.Item>
    );
};

export default Item;