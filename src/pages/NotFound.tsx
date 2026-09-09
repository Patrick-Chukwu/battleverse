import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    // console.error removed for production
  }, [location.pathname]);

  return (
    <div className="page-shell flex items-center justify-center bg-background">
      <div className="glass-card w-full max-w-md rounded-3xl p-8 text-center">
        <p className="mb-4 text-6xl">🧭</p>
        <h1 className="text-title mb-3 font-black">404</h1>
        <p className="mb-6 font-bold text-muted-foreground">That arena does not exist.</p>
        <Link
          to="/"
          className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-primary px-6 py-3 font-black text-primary-foreground"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
