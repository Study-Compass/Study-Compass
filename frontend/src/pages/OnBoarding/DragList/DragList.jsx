import { Reorder } from "framer-motion"
import React, { useState } from "react"
import "./DragList.css"
import Item from "./Item/Item"

function DragList() {
    const [items, setItems] = useState(["outlets", "classroom type", "printer"])

    return (
        <div className="DragList">
            <Reorder.Group axis="y" values={items} onReorder={setItems}>
                {items.map((item) => (
                    <Item key={item} item={item} />
                ))}

            </Reorder.Group>
        </div>
    )
}

export default DragList