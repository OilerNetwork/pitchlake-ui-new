const HoverIcon = ({
  classname,
  stroke,
  fill,
}: {
  classname?: string;
  stroke?: string;
  fill?: string;
}) => {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6.66667 2.5H6.5C5.09987 2.5 4.3998 2.5 3.86502 2.77248C3.39462 3.01217 3.01217 3.39462 2.77248 3.86502C2.5 4.3998 2.5 5.09987 2.5 6.5V6.66667M6.66667 17.5H6.5C5.09987 17.5 4.3998 17.5 3.86502 17.2275C3.39462 16.9878 3.01217 16.6054 2.77248 16.135C2.5 15.6002 2.5 14.9001 2.5 13.5V13.3333M17.5 6.66667V6.5C17.5 5.09987 17.5 4.3998 17.2275 3.86502C16.9878 3.39462 16.6054 3.01217 16.135 2.77248C15.6002 2.5 14.9001 2.5 13.5 2.5H13.3333"
        stroke="#121212"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.413 12.2664C17.7393 12.1395 17.9025 12.0761 17.9483 11.9864C17.988 11.9087 17.9867 11.8164 17.945 11.7397C17.8969 11.6512 17.7321 11.5921 17.4026 11.4738L8.99798 8.45674C8.72838 8.35997 8.59358 8.31158 8.50546 8.34209C8.42884 8.36863 8.36863 8.42884 8.34209 8.50546C8.31158 8.59358 8.35997 8.72838 8.45674 8.99798L11.4738 17.4026C11.5921 17.7322 11.6512 17.8969 11.7397 17.9451C11.8163 17.9868 11.9086 17.988 11.9864 17.9483C12.0761 17.9025 12.1395 17.7393 12.2664 17.413L13.64 13.881C13.6648 13.8171 13.6773 13.7851 13.6965 13.7582C13.7135 13.7344 13.7343 13.7135 13.7582 13.6965C13.7851 13.6773 13.8171 13.6649 13.881 13.64L17.413 12.2664Z"
        fill="#121212"
        stroke="#121212"
      />
    </svg>
  );
};

export default HoverIcon;
