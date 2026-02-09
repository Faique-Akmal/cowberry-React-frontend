import loading from "../../assets/Loading.json";
import Lottie from "lottie-react";
const LoadingAnimation = () => {
  const style = {
    height: 150,
  };
  return (
    <div>
      <Lottie animationData={loading} loop={true} style={style} />
    </div>
  );
};

export default LoadingAnimation;
