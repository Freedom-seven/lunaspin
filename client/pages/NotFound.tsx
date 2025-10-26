import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import Layout from "@/components/Layout";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-extrabold mb-4">404</h1>
          <p className="text-xl text-white/70 mb-6">Oops! Page not found</p>
          <Link to="/" className="text-secondary underline">Return to Home</Link>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
