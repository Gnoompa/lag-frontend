import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Text } from "@chakra-ui/react";

const usePrevious = (value: number) => {
  const ref = useRef<number>();
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
};

const getBackgroundSize = (value: number) => {
  return { backgroundSize: `${(value * 100) / 1000}% 100%` };
};

const formatForDisplay = (number: number, includeDecimals: boolean) => {
  return parseFloat(`${Math.max(number, 0)}`)
    .toFixed(includeDecimals ? 2 : 0)
    .split("")
    .reverse();
};

const DecimalColumn = ({ fontSize, color }: { fontSize: string; color: string }) => {
  return (
    <div>
      <span
        style={{
          fontSize: fontSize,
          lineHeight: fontSize,
          color: color,
        }}
      >
        .
      </span>
    </div>
  );
};

// @ts-ignore
const NumberColumn = ({ digit, delta, fontSize, color, incrementColor, decrementColor }) => {
  const [position, setPosition] = useState(0);
  const [animationClass, setAnimationClass] = useState<string>();
  const previousDigit = usePrevious(digit);
  const columnContainer = useRef<HTMLElement>(null);

  const setColumnToNumber = (number: number) => {
    setPosition(columnContainer.current!.clientHeight * parseInt(`${number}`, 10));
  };

  useEffect(() => setAnimationClass(previousDigit !== digit ? delta : ""), [digit, delta]);

  useEffect(() => setColumnToNumber(digit), [digit]);

  return (
    <div
      // @ts-ignore
      ref={columnContainer}
      style={{
        fontSize: fontSize,
        lineHeight: fontSize,
        position: "relative",
        color: color,
        height: "auto",
      }}
    >
      <motion.div
        animate={{ x: 0, y: position }}
        className={`ticker-column ${animationClass}`}
        onAnimationComplete={() => setAnimationClass("")}
        style={{          
          position: "absolute",
          height: "1000%",
          bottom: 0,          
        }}
      >
        {[9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map((num) => (
          <div key={num} style={{ width: "auto", height: "10%" }}>
            <Text              
              style={{
                fontWeight: "bold",
                fontSize: fontSize,
                lineHeight: fontSize,
                color: "var(--chakra-colors-fg)",
              }}
            >
              {num}
            </Text>
          </div>
        ))}
      </motion.div>
      <span className="number-placeholder" style={{ visibility: "hidden" }}>
        0
      </span>
    </div>
  );
};

export const AnimatedCounter = ({
  value = 0,
  fontSize = "18px",
  color = "white",
  incrementColor = "#32cd32",
  decrementColor = "#fe6862",
  includeDecimals = false,
}) => {
  const numArray = formatForDisplay(value, includeDecimals);
  const previousNumber = usePrevious(value);

  let delta = null;
  if (value > previousNumber!) delta = "increase";
  if (value < previousNumber!) delta = "decrease";

  return (
    <motion.div
      layout
      style={{
        height: "auto",
        display: "flex",
        flexDirection: "row-reverse",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {numArray.map((number, index) =>
        number === "." ? (
          <DecimalColumn key={index} fontSize={fontSize} color={color} />
        ) : (
          <NumberColumn
            key={index}
            digit={number}
            delta={delta}
            fontSize={fontSize}
            incrementColor={incrementColor}
            decrementColor={decrementColor}
            // @ts-ignore
            includeDecimals={includeDecimals}
          />
        )
      )}
    </motion.div>
  );
};
