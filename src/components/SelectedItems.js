import React from "react";
import { FaTrash } from "react-icons/fa"; // Import trash icon from react-icons

const SelectedItems = ({ selectedItems, toggleSelectItem }) => {
  return (
    <>
      {selectedItems.length > 0 && (
        <div className="mt-2 w-full rounded-lg bg-neutral-900 p-4">
          <h2 className="text-lg font-bold">Selected Music</h2>
          <p className="text-md">
            {selectedItems.length} selected (minimum 10 required)
          </p>
          <div className="flex flex-wrap gap-2 mt-2 py-2">
            {selectedItems.map((item) => (
              <div
                key={item.id}
                className="bg-neutral-800 px-3 py-2 rounded-lg shadow-lg w-fit flex items-center justify-between"
              >
                {/* Song/Album Name */}
                <div className="">
                  <p className="text-md truncate">{item.name}</p>
                  <p className="text-sm truncate">{item.artists?.[0]?.name}</p>
                </div>

                {/* Delete icon */}
                <button
                  onClick={() => toggleSelectItem(item)}
                  className="ml-4 text-red-500 hover:text-red-700"
                >
                  <FaTrash size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default SelectedItems;
