import { useEffect, useState } from "react";

export function useHashRoute(defaultRoute = "app") {
  const get = () => window.location.hash.replace("#/", "") || defaultRoute;
  const [route, setRoute] = useState(get());
  useEffect(() => {
    const onHash = () => setRoute(get());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const navigate = (to) => {
    if (!to.startsWith("/")) to = "/" + to;
    window.location.hash = to;
    setRoute(to.replace("/", ""));
  };
  return { route, navigate };
}
