const HourglassSimpleIcon = ({
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
      width="12"
      height="15"
      className={classname}
      stroke={stroke}
      fill={fill}
      viewBox="0 0 12 15"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4.00065 11.833H8.00065M2.40065 0.833008H9.60065C9.97402 0.833008 10.1607 0.833008 10.3033 0.90567C10.4288 0.969586 10.5307 1.07157 10.5947 1.19701C10.6673 1.33962 10.6673 1.52631 10.6673 1.89967V3.28269C10.6673 3.60881 10.6673 3.77187 10.6305 3.92532C10.5978 4.06137 10.5439 4.19142 10.4708 4.31072C10.3884 4.44528 10.2731 4.56058 10.0425 4.79118L8.08823 6.74543C7.82422 7.00944 7.69222 7.14144 7.64276 7.29366C7.59925 7.42756 7.59925 7.57179 7.64276 7.70569C7.69222 7.85791 7.82422 7.98991 8.08823 8.25392L10.0425 10.2082C10.2731 10.4388 10.3884 10.5541 10.4708 10.6886C10.5439 10.8079 10.5978 10.938 10.6305 11.074C10.6673 11.2275 10.6673 11.3905 10.6673 11.7167V13.0997C10.6673 13.473 10.6673 13.6597 10.5947 13.8023C10.5307 13.9278 10.4288 14.0298 10.3033 14.0937C10.1607 14.1663 9.97402 14.1663 9.60065 14.1663H2.40065C2.02728 14.1663 1.8406 14.1663 1.69799 14.0937C1.57255 14.0298 1.47056 13.9278 1.40665 13.8023C1.33398 13.6597 1.33398 13.473 1.33398 13.0997V11.7167C1.33398 11.3905 1.33398 11.2275 1.37082 11.074C1.40349 10.938 1.45736 10.8079 1.53046 10.6886C1.61292 10.5541 1.72822 10.4388 1.95882 10.2082L3.91307 8.25392C4.17708 7.98991 4.30909 7.85791 4.35855 7.70569C4.40205 7.57179 4.40205 7.42756 4.35855 7.29366C4.30909 7.14145 4.17708 7.00943 3.91307 6.74543L1.95882 4.79118C1.72822 4.56058 1.61292 4.44528 1.53046 4.31072C1.45736 4.19142 1.40349 4.06137 1.37082 3.92532C1.33398 3.77187 1.33398 3.60881 1.33398 3.28269V1.89967C1.33398 1.52631 1.33398 1.33962 1.40665 1.19701C1.47056 1.07157 1.57255 0.969586 1.69799 0.90567C1.8406 0.833008 2.02728 0.833008 2.40065 0.833008Z"
        stroke="#BFBFBF"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default HourglassSimpleIcon;
