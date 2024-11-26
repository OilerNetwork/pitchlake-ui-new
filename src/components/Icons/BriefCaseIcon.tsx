const BriefCaseIcon = ({
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
      className={classname}
      width="19"
      height="18"
      viewBox="0 0 19 18"
      fill={fill}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12.5 5.25C12.5 4.55252 12.5 4.20378 12.4233 3.91766C12.2153 3.1412 11.6088 2.53472 10.8323 2.32667C10.5462 2.25 10.1975 2.25 9.5 2.25C8.80252 2.25 8.45378 2.25 8.16766 2.32667C7.3912 2.53472 6.78472 3.1412 6.57667 3.91766C6.5 4.20378 6.5 4.55252 6.5 5.25M4.4 15.75H14.6C15.4401 15.75 15.8601 15.75 16.181 15.5865C16.4632 15.4427 16.6927 15.2132 16.8365 14.931C17 14.6101 17 14.1901 17 13.35V7.65C17 6.80992 17 6.38988 16.8365 6.06901C16.6927 5.78677 16.4632 5.5573 16.181 5.41349C15.8601 5.25 15.4401 5.25 14.6 5.25H4.4C3.55992 5.25 3.13988 5.25 2.81901 5.41349C2.53677 5.5573 2.3073 5.78677 2.16349 6.06901C2 6.38988 2 6.80992 2 7.65V13.35C2 14.1901 2 14.6101 2.16349 14.931C2.3073 15.2132 2.53677 15.4427 2.81901 15.5865C3.13988 15.75 3.55992 15.75 4.4 15.75Z"
        stroke={stroke}
        //stroke-width="1.5"
        //stroke-linecap="round"
        //stroke-linejoin="round"
      />
    </svg>
  );
};

export default BriefCaseIcon;
