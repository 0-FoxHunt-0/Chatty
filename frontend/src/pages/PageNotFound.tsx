import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import illustration404 from "../assets/404.svg";

function PageNotFound() {
  const navigate = useNavigate();

  return (
    <section className="bg-base-100 min-h-screen w-full">
      <div className="container min-h-screen px-6 py-12 mx-auto lg:flex lg:items-center lg:gap-12">
        <div className="w-full lg:w-1/2">
          <p className="text-sm font-medium text-primary">404 error</p>
          <h1 className="mt-3 text-2xl font-semibold text-base-content md:text-3xl">
            Page not found
          </h1>
          <p className="mt-4 text-base-content/70">
            Sorry, the page you are looking for doesn't exist. Here are some
            helpful links:
          </p>
          <div className="flex items-center mt-6 gap-x-3">
            <button
              className="btn btn-outline btn-sm sm:btn-md gap-2"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="w-4 h-4" />
              Go back
            </button>
            <button
              className="btn btn-primary btn-sm sm:btn-md gap-2"
              onClick={() => navigate("/", { replace: true })}
            >
              <Home className="w-4 h-4" />
              Take me home
            </button>
          </div>
        </div>
        <div className="relative w-full mt-12 lg:w-1/2 lg:mt-0">
          <div className="w-full max-w-lg lg:mx-auto bg-base-100 rounded-lg">
            <img
              className="w-full"
              src={illustration404}
              alt="404 illustration"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default PageNotFound;
