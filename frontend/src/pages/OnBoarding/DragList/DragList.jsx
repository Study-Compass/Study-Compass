import { Reorder } from "framer-motion"
import React, { useState } from "react"
import "./DragList.scss"
import Item from "./Item/Item"

function DragList({items, setItems, details}) {
    return (
        <div className="DragList">
            <Reorder.Group axis="y" values={items} onReorder={setItems}>
                {items.map((item) => (
                    <Item key={item} item={item} details={details}/>
                ))}
            </Reorder.Group>
        </div>
    )
}

export default DragList