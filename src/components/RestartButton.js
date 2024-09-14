import React from "react";

const RestartButton = ({ restartProcess }) => {
  return (
    <div className="mt-8 text-center">
      <button
        className="px-6 py-2 bg-red-500 text-white rounded-lg"
        onClick={restartProcess}
      >
        Restart
      </button>
    </div>
  );
};

export default RestartButton;
