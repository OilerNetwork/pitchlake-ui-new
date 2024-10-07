const ArrowUpIcon = ({
  classname,
  stroke,
  fill,
}: {
  classname?: string;
  fill?: string;
  stroke?: string;
}) => {
  return (
    <svg
      className={classname}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill={fill}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 10L8 6L12 10"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default ArrowUpIcon;
