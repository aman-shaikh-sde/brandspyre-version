// import { IoIosStar } from "react-icons/io";

// const StarRating = ({ rating, maxRating = 5 }) => {
//   return (
//     <div className="flex items-center">
//       {[...Array(maxRating)].map((_, index) => (
//         <IoIosStar
//           key={index}
//           size={20}
//           className={
//             index < rating 
//               ? "text-yellow-500" 
//               : "text-gray-300 dark:text-gray-500"
//           }
//         />
//       ))}
//     </div>
//   );
// };
// export default StarRating;
import { IoIosStar } from "react-icons/io";
import { useState } from "react";

const StarRating = ({ rating, maxRating = 5, editable = false, onRatingChange }) => {
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (newRating) => {
    if (editable && onRatingChange) {
      onRatingChange(newRating);
    }
  };

  const handleMouseEnter = (newHoverRating) => {
    if (editable) {
      setHoverRating(newHoverRating);
    }
  };

  const handleMouseLeave = () => {
    if (editable) {
      setHoverRating(0);
    }
  };

  return (
    <div className="flex items-center">
      {[...Array(maxRating)].map((_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= (hoverRating || rating);
        
        return (
          <button
            key={index}
            type="button"
            className={`${editable ? 'cursor-pointer' : 'cursor-default'}`}
            onClick={() => handleClick(starValue)}
            onMouseEnter={() => handleMouseEnter(starValue)}
            onMouseLeave={handleMouseLeave}
            disabled={!editable}
          >
            <IoIosStar
              size={20}
              className={
                isFilled 
                  ? "text-yellow-500" 
                  : "text-gray-300 dark:text-gray-500"
              }
            />
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;